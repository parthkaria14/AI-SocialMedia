from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import json
from datetime import datetime

from models.database import get_db, init_db, Brand, Post, Analytics, Strategy
from scrapers.instagram_scraper import InstagramScraper
from agents.brand_analyzer import BrandAnalyzer
from generators.image_generator import ImageGenerator

app = FastAPI(title="AI Social Media Agency API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def startup_event():
    init_db()

# Pydantic Models
class BrandCreate(BaseModel):
    name: str
    instagram_handle: str
    twitter_handle: Optional[str] = None
    linkedin_handle: Optional[str] = None

class ContentGenerate(BaseModel):
    brand_id: int
    platform: str = "instagram"
    count: int = 5

class PostCreate(BaseModel):
    brand_id: int
    platform: str
    content_type: str
    caption: str
    hashtags: List[str]
    scheduled_time: Optional[str] = None

class ImageGenerate(BaseModel):
    brand_id: int
    content_ideas: List[dict]
    count: int = 3

class CaptionGenerate(BaseModel):
    brand_id: int
    content_idea: dict
    platform: str = "instagram"

# Routes

@app.get("/")
def root():
    return {
        "message": "AI Social Media Agency API",
        "version": "1.0.0",
        "status": "running"
    }

@app.post("/brands/")
def create_brand(brand: BrandCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Create a new brand and scrape its Instagram data
    """
    # Check if brand already exists
    existing = db.query(Brand).filter(Brand.instagram_handle == brand.instagram_handle).first()
    if existing:
        raise HTTPException(status_code=400, detail="Brand already exists")
    
    # Create brand
    new_brand = Brand(
        name=brand.name,
        instagram_handle=brand.instagram_handle,
        twitter_handle=brand.twitter_handle,
        linkedin_handle=brand.linkedin_handle,
        brand_profile={},
        last_synced=datetime.utcnow()
    )
    
    db.add(new_brand)
    db.commit()
    db.refresh(new_brand)
    
    # Scrape and analyze in background
    background_tasks.add_task(scrape_and_analyze_brand, new_brand.id, brand.instagram_handle)
    
    return {
        "message": "Brand created successfully",
        "brand_id": new_brand.id,
        "status": "scraping_started"
    }

@app.get("/brands/")
def get_brands(db: Session = Depends(get_db)):
    """
    Get all brands
    """
    brands = db.query(Brand).all()
    return brands

@app.get("/brands/{brand_id}")
def get_brand(brand_id: int, db: Session = Depends(get_db)):
    """
    Get single brand with full details
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Get recent posts
    posts = db.query(Post).filter(Post.brand_id == brand_id).order_by(Post.created_at.desc()).limit(10).all()
    
    # Get analytics
    analytics = db.query(Analytics).filter(Analytics.brand_id == brand_id).order_by(Analytics.timestamp.desc()).limit(10).all()
    
    return {
        "brand": brand,
        "recent_posts": posts,
        "analytics": analytics
    }

@app.post("/brands/{brand_id}/sync")
def sync_brand(brand_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Resync brand data from Instagram
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    background_tasks.add_task(scrape_and_analyze_brand, brand_id, brand.instagram_handle)
    
    return {"message": "Sync started", "brand_id": brand_id}

@app.post("/content/generate")
def generate_content(request: ContentGenerate, db: Session = Depends(get_db)):
    """
    Generate content ideas for a brand
    """
    brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    if not brand.brand_profile:
        raise HTTPException(status_code=400, detail="Brand profile not analyzed yet. Please sync brand first.")
    
    # Generate content ideas
    analyzer = BrandAnalyzer()
    content_ideas = analyzer.generate_content_ideas(
        brand.brand_profile,
        platform=request.platform,
        count=request.count
    )
    
    return {
        "brand_id": request.brand_id,
        "platform": request.platform,
        "content_ideas": content_ideas
    }

@app.post("/content/caption")
def generate_caption(request: CaptionGenerate, db: Session = Depends(get_db)):
    """
    Generate caption for specific content idea
    """
    brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    analyzer = BrandAnalyzer()
    caption_data = analyzer.generate_caption(
        brand.brand_profile,
        request.content_idea,
        platform=request.platform
    )
    
    return caption_data

@app.post("/posts/")
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    """
    Create a new post (draft or scheduled)
    """
    brand = db.query(Brand).filter(Brand.id == post.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    scheduled_time = None
    if post.scheduled_time:
        scheduled_time = datetime.fromisoformat(post.scheduled_time)
    
    new_post = Post(
        brand_id=post.brand_id,
        platform=post.platform,
        content_type=post.content_type,
        caption=post.caption,
        hashtags=post.hashtags,
        status="draft" if not scheduled_time else "scheduled",
        scheduled_time=scheduled_time,
        media_urls=[]
    )
    
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    
    return {
        "message": "Post created successfully",
        "post_id": new_post.id,
        "status": new_post.status
    }

@app.get("/posts/brand/{brand_id}")
def get_brand_posts(brand_id: int, status: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Get all posts for a brand
    """
    query = db.query(Post).filter(Post.brand_id == brand_id)
    
    if status:
        query = query.filter(Post.status == status)
    
    posts = query.order_by(Post.created_at.desc()).all()
    return posts

@app.get("/analytics/brand/{brand_id}")
def get_brand_analytics(brand_id: int, db: Session = Depends(get_db)):
    """
    Get analytics for a brand
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    analytics = db.query(Analytics).filter(Analytics.brand_id == brand_id).order_by(Analytics.timestamp.desc()).all()
    
    # Calculate summary stats
    total_posts = db.query(Post).filter(Post.brand_id == brand_id, Post.status == "posted").count()
    
    if analytics:
        avg_engagement = sum(a.engagement_rate for a in analytics) / len(analytics)
        total_likes = sum(a.likes for a in analytics)
        total_comments = sum(a.comments for a in analytics)
    else:
        avg_engagement = 0
        total_likes = 0
        total_comments = 0
    
    return {
        "brand_id": brand_id,
        "summary": {
            "total_posts": total_posts,
            "avg_engagement_rate": round(avg_engagement, 2),
            "total_likes": total_likes,
            "total_comments": total_comments
        },
        "analytics": analytics
    }

@app.post("/strategy/generate/{brand_id}")
def generate_strategy(brand_id: int, db: Session = Depends(get_db)):
    """
    Generate marketing strategy for a brand
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    if not brand.brand_profile:
        raise HTTPException(status_code=400, detail="Brand profile not analyzed yet")
    
    # Get recent analytics
    analytics = db.query(Analytics).filter(Analytics.brand_id == brand_id).order_by(Analytics.timestamp.desc()).limit(20).all()
    
    # Convert to dict for analysis
    analytics_data = [
        {
            "caption": a.post.caption if a.post else "",
            "engagement_rate": a.engagement_rate,
            "likes": a.likes,
            "comments": a.comments
        }
        for a in analytics if a.post
    ]
    
    analyzer = BrandAnalyzer()
    performance_analysis = analyzer.analyze_performance(analytics_data)
    
    # Save strategy
    strategy = Strategy(
        brand_id=brand_id,
        strategy_type="performance_optimization",
        strategy_data=performance_analysis,
        ai_recommendations=json.dumps(performance_analysis.get('recommendations', [])),
        status="active"
    )
    
    db.add(strategy)
    db.commit()
    
    return {
        "brand_id": brand_id,
        "strategy": performance_analysis
    }

@app.post("/images/generate")
def generate_images(request: ImageGenerate, db: Session = Depends(get_db)):
    """
    Generate images for content ideas
    """
    brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    if not brand.brand_profile:
        raise HTTPException(status_code=400, detail="Brand profile not analyzed yet")
    
    generator = ImageGenerator()
    results = generator.batch_generate(request.content_ideas, brand.brand_profile, count=request.count)
    
    return {
        "brand_id": request.brand_id,
        "generated_images": results
    }

@app.post("/images/generate-single")
def generate_single_image(prompt: str, width: int = 1024, height: int = 1024):
    """
    Generate single image from prompt
    """
    generator = ImageGenerator()
    result = generator.generate_with_pollinations(prompt, width, height)
    return result

# Background Tasks
def scrape_and_analyze_brand(brand_id: int, instagram_handle: str):
    """
    Background task to scrape and analyze brand
    """
    scraper = InstagramScraper()
    analyzer = BrandAnalyzer()
    
    # Scrape data
    brand_data = scraper.get_complete_brand_data(instagram_handle, max_posts=30)
    
    if not brand_data:
        print(f"Failed to scrape brand: {instagram_handle}")
        return
    
    # Analyze with AI
    brand_profile = analyzer.analyze_brand_profile(brand_data)
    
    # Update database
    db = next(get_db())
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    
    if brand:
        brand.brand_profile = brand_profile
        brand.last_synced = datetime.utcnow()
        db.commit()
        
        # Store analytics
        for post in brand_data.get('posts', []):
            analytics = Analytics(
                brand_id=brand_id,
                platform="instagram",
                likes=post.get('likes', 0),
                comments=post.get('comments', 0),
                engagement_rate=post.get('engagement_rate', 0),
                timestamp=datetime.utcnow()
            )
            db.add(analytics)
        
        db.commit()
    
    db.close()
    print(f"Completed analysis for brand: {instagram_handle}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)