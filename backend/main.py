from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import json
import os
from datetime import datetime

from models.database import get_db, init_db, Brand, Post, Analytics, Strategy, ContentQueue, Campaign, InstagramPost, AgentLog
from agents.campaign_agent import CampaignAgent
from scrapers.instagram_scraper import InstagramScraper
from agents.brand_analyzer import BrandAnalyzer
from agents.competitor_analyzer import CompetitorAnalyzer
from generators.image_generator import ImageGenerator
from agents.orchestrator import OrchestratorAgent
from agents.shared_memory import SharedMemory

app = FastAPI(title="AI Social Media Agency API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for generated images
os.makedirs("data/generated_images", exist_ok=True)
app.mount("/generated_images", StaticFiles(directory="data/generated_images"), name="generated_images")

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
    media_urls: Optional[List[str]] = None
    scheduled_time: Optional[str] = None

class MultiplatformCaptionRequest(BaseModel):
    brand_id: int
    content_idea: dict

class CompetitorAnalysisRequest(BaseModel):
    brand_id: int
    competitor_handles: List[str]

class TrendingContentRequest(BaseModel):
    competitor_handles: List[str]


class CampaignCreate(BaseModel):
    brand_id: int
    name: str
    description: str
    campaign_type: str = "organic"  # organic, paid, mixed
    platforms: List[str]
    objectives: List[str]
    budget: float = 0.0
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class AdPlatformRequest(BaseModel):
    brand_id: int
    objectives: List[str]
    budget: float
    target_metrics: dict

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    campaign_type: Optional[str] = None
    platforms: Optional[List[str]] = None
    objectives: Optional[List[str]] = None
    budget: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class CampaignStatusUpdate(BaseModel):
    status: str  # draft, active, paused, completed

# Routes

@app.get("/")
def root():
    return {
        "message": "AI Social Media Agency API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/images/{filename}")
async def serve_image(filename: str):
    """
    Serve generated images from the local directory
    """
    filepath = os.path.join("data/generated_images", filename)
    if os.path.exists(filepath):
        return FileResponse(filepath)
    raise HTTPException(status_code=404, detail="Image not found")

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
    Generate content ideas for a brand.
    Uses multi-agent enrichment: competitor insights are automatically
    injected when available, so content ideas address competitive gaps.
    """
    brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    if not brand.brand_profile:
        raise HTTPException(status_code=400, detail="Brand profile not analyzed yet. Please sync brand first.")
    
    # Multi-agent enrichment: check for competitor insights from previous analyses
    enriched_profile = dict(brand.brand_profile)
    collaboration_info = {"enriched": False, "agents_involved": ["brand_analyzer"]}
    
    # Look for competitor insights from recent orchestrator runs or competitor analyses
    recent_competitor_log = db.query(AgentLog).filter(
        AgentLog.agent_name == "competitor_analyzer",
        AgentLog.brand_id == request.brand_id,
        AgentLog.success == True
    ).order_by(AgentLog.timestamp.desc()).first()
    
    if recent_competitor_log and recent_competitor_log.output_summary:
        try:
            competitor_data = json.loads(recent_competitor_log.output_summary) if isinstance(recent_competitor_log.output_summary, str) else {}
            if competitor_data.get("competitive_gaps"):
                enriched_profile["competitive_gaps_to_address"] = competitor_data["competitive_gaps"]
                collaboration_info["enriched"] = True
                collaboration_info["agents_involved"].append("competitor_analyzer")
                collaboration_info["enrichment_details"] = f"Content ideas informed by {len(competitor_data['competitive_gaps'])} competitive gaps"
        except (json.JSONDecodeError, TypeError):
            pass
    
    # Generate content ideas with potentially enriched profile
    analyzer = BrandAnalyzer()
    content_ideas = analyzer.generate_content_ideas(
        enriched_profile,
        platform=request.platform,
        count=request.count
    )
    
    return {
        "brand_id": request.brand_id,
        "platform": request.platform,
        "content_ideas": content_ideas,
        "agent_collaboration": collaboration_info
    }

@app.post("/content/caption")
def generate_caption(brand_id: int, content_idea: dict, platform: str = "instagram", db: Session = Depends(get_db)):
    """
    Generate platform-optimized caption for specific content idea
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    analyzer = BrandAnalyzer()
    caption_data = analyzer.generate_caption(
        brand.brand_profile,
        content_idea,
        platform=platform
    )
    
    return caption_data

@app.post("/content/caption-multiplatform")
def generate_multiplatform_captions(brand_id: int, content_idea: dict, platforms: List[str] = ["instagram", "twitter", "linkedin"], db: Session = Depends(get_db)):
    """
    Generate captions optimized for multiple platforms at once
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    analyzer = BrandAnalyzer()
    captions = {}
    
    for platform in platforms:
        caption_data = analyzer.generate_caption(
            brand.brand_profile,
            content_idea,
            platform=platform
        )
        captions[platform] = caption_data
    
    return {
        "brand_id": brand_id,
        "content_idea": content_idea.get('title', 'Untitled'),
        "captions": captions
    }

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
        media_urls=post.media_urls or []
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

@app.get("/posts/{post_id}")
def get_post(post_id: int, db: Session = Depends(get_db)):
    """
    Get a single post by ID
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

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
    
    # Multi-agent enrichment: include competitor context if available
    collaboration_info = {"enriched": False, "agents_involved": ["brand_analyzer"]}
    
    recent_competitor_log = db.query(AgentLog).filter(
        AgentLog.agent_name == "competitor_analyzer",
        AgentLog.brand_id == brand_id,
        AgentLog.success == True
    ).order_by(AgentLog.timestamp.desc()).first()
    
    if recent_competitor_log and recent_competitor_log.output_summary:
        try:
            competitor_data = json.loads(recent_competitor_log.output_summary) if isinstance(recent_competitor_log.output_summary, str) else {}
            if competitor_data:
                performance_analysis["competitive_context"] = {
                    "position": competitor_data.get("position", "unknown"),
                    "opportunities": competitor_data.get("opportunities", []),
                    "threats": competitor_data.get("threats", []),
                    "source": "competitor_analyzer"
                }
                collaboration_info["enriched"] = True
                collaboration_info["agents_involved"].append("competitor_analyzer")
        except (json.JSONDecodeError, TypeError):
            pass
    
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
        "strategy": performance_analysis,
        "agent_collaboration": collaboration_info
    }

@app.post("/images/generate")
def generate_images(brand_id: int, content_ideas: List[dict], count: int = 3, add_text: bool = True, language: str = "english", db: Session = Depends(get_db)):
    """
    Generate images for content ideas with enhanced quality and text overlays
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    if not brand.brand_profile:
        raise HTTPException(status_code=400, detail="Brand profile not analyzed yet")
    
    # Add brand username to profile for text overlay
    brand.brand_profile['username'] = brand.instagram_handle
    
    generator = ImageGenerator()
    results = generator.batch_generate(content_ideas, brand.brand_profile, count=count, add_text=add_text, language=language)
    
    return {
        "brand_id": brand_id,
        "generated_images": results
    }

@app.post("/images/generate-single")
def generate_single_image(prompt: str, title: str = "", width: int = 1080, height: int = 1080, add_text: bool = False, language: str = "english"):
    """
    Generate single image from custom prompt with optional text overlay
    """
    generator = ImageGenerator()
    
    # Create minimal brand profile for generation
    brand_profile = {
        "brand_voice": "professional",
        "visual_style": "modern",
        "username": ""
    }
    
    if add_text and title:
        result = generator.generate_from_custom_prompt(prompt, brand_profile, title=title, add_text=True, language=language)
    else:
        result = generator.generate_with_pollinations(prompt, width, height)
    
    # Return proper URL for frontend
    if result.get('success') and result.get('filename'):
        result['url'] = f"/api/images/{result['filename']}"
    
    return result

@app.delete("/brands/{brand_id}")
def delete_brand(brand_id: int, db: Session = Depends(get_db)):
    """
    Delete a brand and all associated data
    """
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Delete associated posts
    db.query(Post).filter(Post.brand_id == brand_id).delete()
    
    # Delete associated analytics
    db.query(Analytics).filter(Analytics.brand_id == brand_id).delete()
    
    # Delete associated strategies
    db.query(Strategy).filter(Strategy.brand_id == brand_id).delete()
    
    # Delete associated content queue
    db.query(ContentQueue).filter(ContentQueue.brand_id == brand_id).delete()
    
    # Delete brand
    db.delete(brand)
    db.commit()
    
    return {"message": "Brand deleted successfully", "brand_id": brand_id}

@app.post("/competitors/analyze")
def analyze_competitors(request: CompetitorAnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyze competitors for a brand
    """
    brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Get brand's scraped data
    scraper = InstagramScraper()
    brand_data = scraper.get_complete_brand_data(brand.instagram_handle, max_posts=30)
    
    if not brand_data:
        raise HTTPException(status_code=400, detail="Failed to fetch brand data")
    
    # Analyze competitors
    analyzer = CompetitorAnalyzer()
    comparison = analyzer.compare_with_competitors(brand_data, request.competitor_handles)
    
    # Persist to AgentLog for multi-agent enrichment
    import uuid
    try:
        # Extract key insights for other agents to use
        output_summary = {}
        if isinstance(comparison, dict):
            analysis = comparison.get("analysis", comparison)
            output_summary = {
                "competitive_gaps": analysis.get("competitive_gaps", analysis.get("gaps", [])),
                "opportunities": analysis.get("opportunities", []),
                "threats": analysis.get("threats", []),
                "position": analysis.get("brand_position", analysis.get("position", "unknown")),
                "strengths": analysis.get("strengths", [])
            }
        
        log_entry = AgentLog(
            session_id=str(uuid.uuid4()),
            agent_name="competitor_analyzer",
            task="Competitive analysis",
            input_summary=f"Analyzed {len(request.competitor_handles)} competitors",
            output_summary=json.dumps(output_summary),
            success=True,
            duration_ms=0,
            brand_id=request.brand_id
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        print(f"Warning: Failed to persist competitor analysis to AgentLog: {e}")
        
    return comparison

@app.post("/competitors/trending")
def get_trending_content(request: TrendingContentRequest):
    """
    Identify trending content from competitors
    """
    analyzer = CompetitorAnalyzer()
    trends = analyzer.identify_trending_content(request.competitor_handles)
    return trends

@app.get("/analytics/chart-data/{brand_id}")
def get_chart_data(brand_id: int, days: int = 30, db: Session = Depends(get_db)):
    """
    Get analytics data formatted for charts
    """
    from datetime import timedelta
    
    brand = db.query(Brand).filter(Brand.id == brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Get analytics for last N days
    start_date = datetime.utcnow() - timedelta(days=days)
    analytics = db.query(Analytics).filter(
        Analytics.brand_id == brand_id,
        Analytics.timestamp >= start_date
    ).order_by(Analytics.timestamp.asc()).all()
    
    if not analytics:
        return {
            "engagement_over_time": [],
            "content_performance": [],
            "platform_breakdown": {}
        }
    
    # Engagement over time
    engagement_data = [
        {
            "date": a.timestamp.strftime("%Y-%m-%d"),
            "engagement_rate": round(a.engagement_rate, 2),
            "likes": a.likes,
            "comments": a.comments
        }
        for a in analytics
    ]
    
    # Content performance (with posts)
    posts_with_analytics = []
    for a in analytics:
        if a.post:
            posts_with_analytics.append({
                "post_id": a.post.id,
                "caption": a.post.caption[:50] + "..." if len(a.post.caption) > 50 else a.post.caption,
                "engagement_rate": round(a.engagement_rate, 2),
                "likes": a.likes,
                "comments": a.comments,
                "platform": a.platform
            })
    
    # Platform breakdown
    platform_stats = {}
    for a in analytics:
        platform = a.platform
        if platform not in platform_stats:
            platform_stats[platform] = {
                "total_posts": 0,
                "total_likes": 0,
                "total_comments": 0,
                "avg_engagement": 0
            }
        platform_stats[platform]["total_posts"] += 1
        platform_stats[platform]["total_likes"] += a.likes
        platform_stats[platform]["total_comments"] += a.comments
    
    # Calculate averages
    for platform in platform_stats:
        count = platform_stats[platform]["total_posts"]
        if count > 0:
            total_engagement = platform_stats[platform]["total_likes"] + platform_stats[platform]["total_comments"]
            platform_stats[platform]["avg_engagement"] = round(total_engagement / count, 2)
    
    return {
        "engagement_over_time": engagement_data,
        "content_performance": sorted(posts_with_analytics, key=lambda x: x["engagement_rate"], reverse=True)[:10],
        "platform_breakdown": platform_stats
    }

@app.post("/campaigns/")
def create_campaign(campaign: CampaignCreate, db: Session = Depends(get_db)):
    """Create new campaign"""
    brand = db.query(Brand).filter(Brand.id == campaign.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    new_campaign = Campaign(
        brand_id=campaign.brand_id,
        name=campaign.name,
        description=campaign.description,
        campaign_type=campaign.campaign_type,
        status="draft",
        platforms=campaign.platforms,
        objectives=campaign.objectives,
        budget=campaign.budget,
        start_date=datetime.fromisoformat(campaign.start_date) if campaign.start_date else None,
        end_date=datetime.fromisoformat(campaign.end_date) if campaign.end_date else None
    )
    
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    
    return {
        "message": "Campaign created successfully",
        "campaign_id": new_campaign.id
    }

@app.get("/campaigns/brand/{brand_id}")
def get_brand_campaigns(brand_id: int, db: Session = Depends(get_db)):
    """Get all campaigns for a brand"""
    campaigns = db.query(Campaign).filter(Campaign.brand_id == brand_id).order_by(Campaign.created_at.desc()).all()
    return campaigns

@app.post("/campaigns/ad-recommendations")
def get_ad_recommendations(request: AdPlatformRequest, db: Session = Depends(get_db)):
    """
    Get AI-powered ad platform recommendations.
    Uses multi-agent enrichment: competitor analysis data is automatically
    factored into platform suggestions when available.
    """
    brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")
    
    # Multi-agent enrichment: enrich objectives with competitor insights
    enriched_objectives = list(request.objectives)
    collaboration_info = {"enriched": False, "agents_involved": ["campaign_agent"]}
    
    recent_competitor_log = db.query(AgentLog).filter(
        AgentLog.agent_name == "competitor_analyzer",
        AgentLog.brand_id == request.brand_id,
        AgentLog.success == True
    ).order_by(AgentLog.timestamp.desc()).first()
    
    if recent_competitor_log and recent_competitor_log.output_summary:
        try:
            competitor_data = json.loads(recent_competitor_log.output_summary) if isinstance(recent_competitor_log.output_summary, str) else {}
            if competitor_data.get("competitive_gaps"):
                enriched_objectives.append("competitive_differentiation")
                collaboration_info["enriched"] = True
                collaboration_info["agents_involved"].append("competitor_analyzer")
                collaboration_info["enrichment_details"] = "Ad recommendations factor in competitive gaps"
        except (json.JSONDecodeError, TypeError):
            pass
    
    campaign_agent = CampaignAgent()
    recommendations = campaign_agent.recommend_ad_platforms(
        brand.brand_profile,
        enriched_objectives,
        request.budget,
        request.target_metrics
    )
    
    recommendations["agent_collaboration"] = collaboration_info
    
    return recommendations

@app.get("/campaigns/{campaign_id}/performance")
def get_campaign_performance(campaign_id: int, db: Session = Depends(get_db)):
    """Get campaign performance metrics"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get campaign analytics
    analytics = db.query(Analytics).filter(Analytics.campaign_id == campaign_id).all()
    
    campaign_agent = CampaignAgent()
    metrics = campaign_agent.calculate_campaign_metrics([
        {
            "impressions": a.impressions,
            "clicks": a.clicks,
            "conversions": a.conversions,
            "spend": a.spend,
            "likes": a.likes,
            "comments": a.comments,
            "shares": a.shares
        }
        for a in analytics
    ])
    
    return {
        "campaign": campaign,
        "metrics": metrics,
        "analytics": analytics
    }

@app.put("/campaigns/{campaign_id}")
def update_campaign(campaign_id: int, update_data: CampaignUpdate, db: Session = Depends(get_db)):
    """Update campaign details"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Update fields that are provided
    if update_data.name is not None:
        campaign.name = update_data.name
    if update_data.description is not None:
        campaign.description = update_data.description
    if update_data.campaign_type is not None:
        campaign.campaign_type = update_data.campaign_type
    if update_data.platforms is not None:
        campaign.platforms = update_data.platforms
    if update_data.objectives is not None:
        campaign.objectives = update_data.objectives
    if update_data.budget is not None:
        campaign.budget = update_data.budget
    if update_data.start_date is not None:
        campaign.start_date = datetime.fromisoformat(update_data.start_date) if update_data.start_date else None
    if update_data.end_date is not None:
        campaign.end_date = datetime.fromisoformat(update_data.end_date) if update_data.end_date else None
    
    db.commit()
    db.refresh(campaign)
    
    return {
        "message": "Campaign updated successfully",
        "campaign": campaign
    }

@app.delete("/campaigns/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Delete a campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Delete associated analytics for this campaign
    db.query(Analytics).filter(Analytics.campaign_id == campaign_id).delete()
    
    # Update posts to remove campaign association
    db.query(Post).filter(Post.campaign_id == campaign_id).update({Post.campaign_id: None})
    
    # Delete the campaign
    db.delete(campaign)
    db.commit()
    
    return {"message": "Campaign deleted successfully", "campaign_id": campaign_id}

@app.patch("/campaigns/{campaign_id}/status")
def update_campaign_status(campaign_id: int, status_update: CampaignStatusUpdate, db: Session = Depends(get_db)):
    """Update campaign status (draft, active, paused, completed)"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    valid_statuses = ["draft", "active", "paused", "completed"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    campaign.status = status_update.status
    
    # Set start date if activating for first time
    if status_update.status == "active" and campaign.start_date is None:
        campaign.start_date = datetime.utcnow()
    
    # Set end date if completing
    if status_update.status == "completed" and campaign.end_date is None:
        campaign.end_date = datetime.utcnow()
    
    db.commit()
    db.refresh(campaign)
    
    return {
        "message": f"Campaign status updated to {status_update.status}",
        "campaign": campaign
    }

@app.post("/campaigns/{campaign_id}/analyze")
def analyze_campaign(campaign_id: int, db: Session = Depends(get_db)):
    """Get AI-powered campaign performance analysis"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get campaign analytics
    analytics = db.query(Analytics).filter(Analytics.campaign_id == campaign_id).all()
    
    # Convert campaign to dict
    campaign_data = {
        "name": campaign.name,
        "campaign_type": campaign.campaign_type,
        "platforms": campaign.platforms or [],
        "budget": campaign.budget,
        "spent": campaign.spent,
        "total_impressions": campaign.total_impressions,
        "total_clicks": campaign.total_clicks,
        "total_conversions": campaign.total_conversions
    }
    
    # Convert analytics to list of dicts
    analytics_data = [
        {
            "impressions": a.impressions,
            "clicks": a.clicks,
            "conversions": a.conversions,
            "spend": a.spend,
            "likes": a.likes,
            "comments": a.comments,
            "shares": a.shares,
            "engagement_rate": a.engagement_rate
        }
        for a in analytics
    ]
    
    campaign_agent = CampaignAgent()
    analysis = campaign_agent.analyze_campaign_performance(campaign_data, analytics_data)
    
    return {
        "campaign_id": campaign_id,
        "campaign_name": campaign.name,
        "analysis": analysis
    }

@app.post("/campaigns/{campaign_id}/strategy")
def generate_campaign_strategy(campaign_id: int, duration_days: int = 30, db: Session = Depends(get_db)):
    """Generate AI-powered campaign strategy"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    # Get brand for profile
    brand = db.query(Brand).filter(Brand.id == campaign.brand_id).first()
    if not brand or not brand.brand_profile:
        raise HTTPException(status_code=400, detail="Brand profile not available")
    
    campaign_agent = CampaignAgent()
    strategy = campaign_agent.generate_campaign_strategy(
        brand.brand_profile,
        campaign.objectives or [],
        campaign.budget,
        duration_days
    )
    
    return {
        "campaign_id": campaign_id,
        "campaign_name": campaign.name,
        "strategy": strategy
    }


# ==================== Instagram Posts Endpoints ====================

@app.get("/brands/{brand_id}/instagram-posts")
def get_instagram_posts(brand_id: int, db: Session = Depends(get_db)):
    """Get all scraped Instagram posts for a brand"""
    posts = db.query(InstagramPost).filter(
        InstagramPost.brand_id == brand_id
    ).order_by(InstagramPost.posted_at.desc()).all()
    print(f"DEBUG: Returning {len(posts)} posts for brand {brand_id}")
    return posts


@app.get("/campaigns/{campaign_id}/instagram-posts")
def get_campaign_instagram_posts(campaign_id: int, db: Session = Depends(get_db)):
    """Get Instagram posts linked to a campaign"""
    posts = db.query(InstagramPost).filter(
        InstagramPost.campaign_id == campaign_id
    ).order_by(InstagramPost.posted_at.desc()).all()
    print(f"DEBUG: Returning {len(posts)} posts for campaign {campaign_id}")
    return posts


@app.post("/campaigns/{campaign_id}/link-posts")
def link_posts_to_campaign(campaign_id: int, post_ids: List[int], db: Session = Depends(get_db)):
    """Link Instagram posts to a campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    linked_count = 0
    for post_id in post_ids:
        post = db.query(InstagramPost).filter(InstagramPost.id == post_id).first()
        if post and post.brand_id == campaign.brand_id:
            post.campaign_id = campaign_id
            linked_count += 1
    
    db.commit()
    
    # Recalculate campaign metrics from linked posts
    update_campaign_metrics_from_posts(campaign_id, db)
    
    # Refresh campaign to get updated metrics
    db.refresh(campaign)
    
    return {
        "message": f"Linked {linked_count} posts to campaign",
        "campaign_id": campaign_id,
        "linked_posts": linked_count,
        "total_impressions": campaign.total_impressions,
        "total_clicks": campaign.total_clicks
    }


@app.post("/campaigns/{campaign_id}/unlink-posts")
def unlink_posts_from_campaign(campaign_id: int, post_ids: List[int], db: Session = Depends(get_db)):
    """Unlink Instagram posts from a campaign"""
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    unlinked_count = 0
    for post_id in post_ids:
        post = db.query(InstagramPost).filter(
            InstagramPost.id == post_id,
            InstagramPost.campaign_id == campaign_id
        ).first()
        if post:
            post.campaign_id = None
            unlinked_count += 1
    
    db.commit()
    
    # Recalculate campaign metrics
    update_campaign_metrics_from_posts(campaign_id, db)
    
    return {
        "message": f"Unlinked {unlinked_count} posts from campaign",
        "campaign_id": campaign_id
    }


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
        
        # Store Instagram posts and analytics
        for post in brand_data.get('posts', []):
            # Parse posted_at timestamp
            posted_at = None
            if post.get('timestamp'):
                try:
                    posted_at = datetime.fromisoformat(post['timestamp'].replace('Z', '+00:00'))
                except:
                    posted_at = datetime.utcnow()
            
            # Check if Instagram post already exists (upsert)
            existing_post = db.query(InstagramPost).filter(
                InstagramPost.shortcode == post.get('post_id')
            ).first()
            
            if existing_post:
                # Update existing post metrics
                existing_post.likes = post.get('likes', 0)
                existing_post.comments_count = post.get('comments', 0)
                existing_post.engagement_rate = post.get('engagement_rate', 0)
                existing_post.last_synced = datetime.utcnow()
            else:
                # Create new Instagram post
                ig_post = InstagramPost(
                    brand_id=brand_id,
                    shortcode=post.get('post_id'),
                    post_url=post.get('url'),
                    caption=post.get('caption', ''),
                    likes=post.get('likes', 0),
                    comments_count=post.get('comments', 0),
                    engagement_rate=post.get('engagement_rate', 0),
                    is_video=post.get('is_video', False),
                    media_url=post.get('media_url'),
                    hashtags=post.get('hashtags', []),
                    posted_at=posted_at,
                    last_synced=datetime.utcnow()
                )
                db.add(ig_post)
            
            # Also store in analytics for historical tracking
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
        
        # Update campaign metrics for any campaigns with linked posts
        update_all_campaign_metrics(brand_id, db)
    
    db.close()
    print(f"Completed analysis for brand: {instagram_handle}")


def update_all_campaign_metrics(brand_id: int, db: Session):
    """Update metrics for all campaigns of a brand based on linked Instagram posts"""
    campaigns = db.query(Campaign).filter(Campaign.brand_id == brand_id).all()
    
    for campaign in campaigns:
        update_campaign_metrics_from_posts(campaign.id, db)


def update_campaign_metrics_from_posts(campaign_id: int, db: Session):
    """Calculate campaign metrics from linked Instagram posts"""
    posts = db.query(InstagramPost).filter(
        InstagramPost.campaign_id == campaign_id
    ).all()
    
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        return
    
    if posts:
        total_likes = sum(p.likes for p in posts)
        total_comments = sum(p.comments_count for p in posts)
        avg_engagement = sum(p.engagement_rate for p in posts) / len(posts)
        
        # Update campaign with real metrics
        # Using engagement metrics from actual Instagram posts
        campaign.total_impressions = total_likes * 10  # Rough estimate
        campaign.total_clicks = total_likes + total_comments  # Total engagement
        campaign.total_conversions = len(posts)  # Number of posts
        
        db.commit()


# ==================== Multi-Agent Orchestrator Endpoints ====================

class OrchestratorPipelineRequest(BaseModel):
    pipeline: str
    brand_id: Optional[int] = None
    instagram_handle: Optional[str] = None
    competitor_handles: Optional[List[str]] = None

class OrchestratorDynamicRequest(BaseModel):
    task: str
    brand_id: Optional[int] = None
    instagram_handle: Optional[str] = None
    competitor_handles: Optional[List[str]] = None


@app.get("/orchestrator/pipelines")
def list_pipelines():
    """List all available multi-agent pipelines"""
    orchestrator = OrchestratorAgent()
    return orchestrator.list_pipelines()


@app.post("/orchestrator/execute")
def execute_pipeline(request: OrchestratorPipelineRequest, db: Session = Depends(get_db)):
    """
    Execute a predefined multi-agent pipeline.
    
    Available pipelines:
    - brand_onboarding: Scrape + analyze brand
    - content_creation: Generate ideas + captions + images
    - campaign_planning: Analyze brand + competitors + generate strategy
    - competitive_strategy: Competitor analysis + ad recommendations + strategy + content
    - full_workflow: Complete end-to-end pipeline
    """
    # Build context from request
    context = {}
    
    if request.instagram_handle:
        context["instagram_handle"] = request.instagram_handle
    
    if request.competitor_handles:
        context["competitor_handles"] = request.competitor_handles
    
    # If brand_id provided, load brand context from DB
    if request.brand_id:
        brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        if brand.brand_profile:
            context["brand_profile"] = brand.brand_profile
        if brand.instagram_handle:
            context["instagram_handle"] = brand.instagram_handle
    
    # Execute pipeline
    orchestrator = OrchestratorAgent()
    result = orchestrator.execute_pipeline(request.pipeline, context)
    
    # Persist execution trace to database
    if result.get("execution_trace"):
        for step in result["execution_trace"]:
            log_entry = AgentLog(
                session_id=result.get("session_id", ""),
                agent_name=step.get("agent_name", ""),
                task=step.get("task", ""),
                input_summary=step.get("input_summary", ""),
                output_summary=step.get("output_summary", ""),
                success=step.get("success", False),
                error=step.get("error"),
                duration_ms=step.get("duration_ms", 0),
                brand_id=request.brand_id
            )
            db.add(log_entry)
        db.commit()
    
    return result


@app.post("/orchestrator/dynamic")
def execute_dynamic_task(request: OrchestratorDynamicRequest, db: Session = Depends(get_db)):
    """
    Execute a dynamically planned multi-agent task.
    The orchestrator uses AI to decide which agents to invoke.
    """
    context = {}
    
    if request.instagram_handle:
        context["instagram_handle"] = request.instagram_handle
    
    if request.competitor_handles:
        context["competitor_handles"] = request.competitor_handles
    
    if request.brand_id:
        brand = db.query(Brand).filter(Brand.id == request.brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail="Brand not found")
        
        if brand.brand_profile:
            context["brand_profile"] = brand.brand_profile
        if brand.instagram_handle:
            context["instagram_handle"] = brand.instagram_handle
    
    orchestrator = OrchestratorAgent()
    result = orchestrator.execute_dynamic(request.task, context)
    
    # Persist execution trace
    if result.get("execution_trace"):
        for step in result["execution_trace"]:
            log_entry = AgentLog(
                session_id=result.get("session_id", ""),
                agent_name=step.get("agent_name", ""),
                task=step.get("task", ""),
                input_summary=step.get("input_summary", ""),
                output_summary=step.get("output_summary", ""),
                success=step.get("success", False),
                error=step.get("error"),
                duration_ms=step.get("duration_ms", 0),
                brand_id=request.brand_id
            )
            db.add(log_entry)
        db.commit()
    
    return result


@app.get("/orchestrator/trace/{session_id}")
def get_execution_trace(session_id: str, db: Session = Depends(get_db)):
    """Get the execution trace for a specific orchestrator session"""
    logs = db.query(AgentLog).filter(
        AgentLog.session_id == session_id
    ).order_by(AgentLog.timestamp.asc()).all()
    
    if not logs:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "session_id": session_id,
        "total_steps": len(logs),
        "steps": [
            {
                "agent_name": log.agent_name,
                "task": log.task,
                "input_summary": log.input_summary,
                "output_summary": log.output_summary,
                "success": log.success,
                "error": log.error,
                "duration_ms": log.duration_ms,
                "timestamp": log.timestamp.isoformat() if log.timestamp else None
            }
            for log in logs
        ]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)