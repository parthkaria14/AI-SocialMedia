"""
Celery tasks for background processing
"""

from celery import Celery
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Celery
celery_app = Celery(
    'social_agency',
    broker=os.getenv('REDIS_URL', 'redis://localhost:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://localhost:6379/0')
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)


@celery_app.task(name='scrape_brand_data')
def scrape_brand_data(brand_id, instagram_handle):
    """
    Background task to scrape Instagram data
    """
    from scrapers.instagram_scraper import InstagramScraper
    from agents.brand_analyzer import BrandAnalyzer
    from models.database import SessionLocal, Brand, Analytics
    
    scraper = InstagramScraper()
    analyzer = BrandAnalyzer()
    
    # Scrape data
    brand_data = scraper.get_complete_brand_data(instagram_handle, max_posts=30)
    
    if not brand_data:
        return {"success": False, "error": "Failed to scrape data"}
    
    # Analyze with AI
    brand_profile = analyzer.analyze_brand_profile(brand_data)
    
    # Update database
    db = SessionLocal()
    try:
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
            return {"success": True, "brand_id": brand_id}
    finally:
        db.close()


@celery_app.task(name='post_to_social_media')
def post_to_social_media(post_id):
    """
    Background task to post content to social media
    """
    from schedulers.social_poster import SocialMediaScheduler
    from models.database import SessionLocal, Post
    
    db = SessionLocal()
    try:
        post = db.query(Post).filter(Post.id == post_id).first()
        
        if not post:
            return {"success": False, "error": "Post not found"}
        
        scheduler = SocialMediaScheduler()
        
        # Post to platform
        result = scheduler.post_to_platform(
            platform=post.platform,
            content_type=post.content_type,
            caption=post.caption,
            hashtags=post.hashtags,
            media_path=post.media_urls[0] if post.media_urls else None
        )
        
        # Update post status
        if result.get('success'):
            post.status = 'posted'
            post.posted_time = datetime.utcnow()
            post.post_url = result.get('url')
        else:
            post.status = 'failed'
        
        db.commit()
        return result
    finally:
        db.close()


@celery_app.task(name='generate_daily_content')
def generate_daily_content(brand_id):
    """
    Generate daily content for a brand
    """
    from agents.brand_analyzer import BrandAnalyzer
    from models.database import SessionLocal, Brand, ContentQueue
    
    db = SessionLocal()
    try:
        brand = db.query(Brand).filter(Brand.id == brand_id).first()
        
        if not brand or not brand.brand_profile:
            return {"success": False, "error": "Brand not ready"}
        
        analyzer = BrandAnalyzer()
        
        # Generate content ideas
        ideas = analyzer.generate_content_ideas(
            brand.brand_profile,
            platform="instagram",
            count=3
        )
        
        # Add to content queue
        for idea in ideas:
            queue_item = ContentQueue(
                brand_id=brand_id,
                content_type="content_idea",
                priority=1,
                status="pending",
                data=idea
            )
            db.add(queue_item)
        
        db.commit()
        return {"success": True, "ideas_generated": len(ideas)}
    finally:
        db.close()


@celery_app.task(name='schedule_posts_for_week')
def schedule_posts_for_week(brand_id):
    """
    Create a week's worth of scheduled posts
    """
    from agents.brand_analyzer import BrandAnalyzer
    from generators.image_generator import ImageGenerator
    from models.database import SessionLocal, Brand, Post
    
    db = SessionLocal()
    try:
        brand = db.query(Brand).filter(Brand.id == brand_id).first()
        
        if not brand or not brand.brand_profile:
            return {"success": False, "error": "Brand not ready"}
        
        analyzer = BrandAnalyzer()
        generator = ImageGenerator()
        
        # Generate 7 content ideas (one per day)
        ideas = analyzer.generate_content_ideas(
            brand.brand_profile,
            platform="instagram",
            count=7
        )
        
        posts_created = []
        
        for i, idea in enumerate(ideas):
            # Generate caption
            caption_data = analyzer.generate_caption(
                brand.brand_profile,
                idea,
                platform="instagram"
            )
            
            # Generate image
            image_result = generator.generate_social_post_image(idea, brand.brand_profile)
            
            # Schedule post (one per day)
            scheduled_time = datetime.utcnow() + timedelta(days=i+1, hours=10)
            
            post = Post(
                brand_id=brand_id,
                platform="instagram",
                content_type="image",
                caption=caption_data.get('caption', ''),
                hashtags=caption_data.get('hashtags', []),
                media_urls=[image_result.get('filepath')] if image_result.get('success') else [],
                status='scheduled',
                scheduled_time=scheduled_time
            )
            
            db.add(post)
            posts_created.append({
                "title": idea.get('title'),
                "scheduled_for": scheduled_time.isoformat()
            })
        
        db.commit()
        return {
            "success": True,
            "posts_created": len(posts_created),
            "schedule": posts_created
        }
    finally:
        db.close()


# Periodic tasks configuration
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """
    Setup periodic tasks (cron jobs)
    """
    # Check for scheduled posts every 5 minutes
    sender.add_periodic_task(
        300.0,  # 5 minutes
        check_scheduled_posts.s(),
        name='check scheduled posts every 5 minutes'
    )


@celery_app.task(name='check_scheduled_posts')
def check_scheduled_posts():
    """
    Check for posts that need to be published
    """
    from models.database import SessionLocal, Post
    
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        # Get posts scheduled for now or earlier
        posts = db.query(Post).filter(
            Post.status == 'scheduled',
            Post.scheduled_time <= now
        ).all()
        
        for post in posts:
            # Queue the post for publishing
            post_to_social_media.delay(post.id)
        
        return {"success": True, "posts_queued": len(posts)}
    finally:
        db.close()


if __name__ == "__main__":
    print("Celery worker ready!")
    print("Run with: celery -A schedulers.celery_tasks worker --loglevel=info")