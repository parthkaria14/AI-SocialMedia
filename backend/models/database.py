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

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
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
    analytics = relationship("Analytics", back_populates="post")

class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"))
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=True)
    platform = Column(String)
    likes = Column(Integer, default=0)
    comments = Column(Integer, default=0)
    shares = Column(Integer, default=0)
    reach = Column(Integer, default=0)
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

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()