from sqlalchemy import create_engine, Column, Integer, String, DateTime, JSON, Float, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agency.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Brand(Base):
    __tablename__ = "brands"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    instagram_handle = Column(String, unique=True, nullable=False)
    twitter_handle = Column(String)
    linkedin_handle = Column(String)
    brand_profile = Column(JSON)  # AI-generated brand DNA
    created_at = Column(DateTime, default=datetime.utcnow)
    last_synced = Column(DateTime)
    
    posts = relationship("Post", back_populates="brand")
    analytics = relationship("Analytics", back_populates="brand")
    strategies = relationship("Strategy", back_populates="brand")
    campaigns = relationship("Campaign", back_populates="brand")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    platform = Column(String)  # instagram, twitter, linkedin
    content_type = Column(String)  # text, image, video
    caption = Column(Text)
    media_urls = Column(JSON)  # list of media URLs
    hashtags = Column(JSON)
    status = Column(String, default="draft")  # draft, scheduled, posted, failed
    scheduled_time = Column(DateTime)
    posted_time = Column(DateTime)
    post_url = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    brand = relationship("Brand", back_populates="posts")
    campaign = relationship("Campaign", back_populates="posts")
    analytics = relationship("Analytics", back_populates="post")

class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    platform = Column(String)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    reach = Column(Integer, default=0)
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    spend = Column(Float, default=0.0)
    engagement_rate = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    brand = relationship("Brand", back_populates="analytics")
    post = relationship("Post", back_populates="analytics")

class Strategy(Base):
    __tablename__ = "strategies"
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    strategy_type = Column(String)  # content_calendar, growth_tactics, engagement
    strategy_data = Column(JSON)
    ai_recommendations = Column(Text)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime)
    
    brand = relationship("Brand", back_populates="strategies")

class ContentQueue(Base):
    __tablename__ = "content_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    content_type = Column(String)
    priority = Column(Integer, default=0)
    status = Column(String, default="pending")
    data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

class Campaign(Base):
    __tablename__ = "campaigns"
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    name = Column(String, nullable=False)
    description = Column(Text)
    campaign_type = Column(String, default="organic")
    status = Column(String, default="draft")
    platforms = Column(JSON)
    objectives = Column(JSON)
    budget = Column(Float, default=0.0)
    spent = Column(Float, default=0.0)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    total_impressions = Column(Integer, default=0)
    total_clicks = Column(Integer, default=0)
    total_conversions = Column(Integer, default=0)
    
    brand = relationship("Brand", back_populates="campaigns")
    posts = relationship("Post", back_populates="campaign")
    instagram_posts = relationship("InstagramPost", back_populates="campaign")


class InstagramPost(Base):
    """Stores scraped Instagram posts with real metrics"""
    __tablename__ = "instagram_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    shortcode = Column(String, unique=True, index=True)  # Instagram post ID (e.g., "CxYz123")
    post_url = Column(String)
    caption = Column(Text)
    likes = Column(Integer, default=0)
    comments_count = Column(Integer, default=0)
    engagement_rate = Column(Float, default=0.0)
    is_video = Column(Boolean, default=False)
    media_url = Column(String)
    hashtags = Column(JSON)
    posted_at = Column(DateTime)  # When it was posted on Instagram
    last_synced = Column(DateTime, default=datetime.utcnow)  # When we last updated metrics
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=True)
    
    brand = relationship("Brand")
    campaign = relationship("Campaign", back_populates="instagram_posts")


class AgentLog(Base):
    """Persists multi-agent execution traces for observability."""
    __tablename__ = "agent_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)  # Groups steps from one orchestrator run
    agent_name = Column(String, nullable=False)
    task = Column(Text)
    input_summary = Column(Text)
    output_summary = Column(Text)
    success = Column(Boolean, default=False)
    error = Column(Text, nullable=True)
    duration_ms = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    
    brand = relationship("Brand")


def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()