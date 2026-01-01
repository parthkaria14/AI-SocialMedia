"""
Test script for AI Social Media Agency
Run this to test all components
"""

import sys
import os
import json
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

print("=" * 60)
print("🚀 AI SOCIAL MEDIA AGENCY - SYSTEM TEST")
print("=" * 60)

# Test 1: Environment Setup
print("\n[TEST 1] Checking Environment Setup...")
try:
    from dotenv import load_dotenv
    load_dotenv()
    
    gemini_key = os.getenv('GEMINI_API_KEY')
    groq_key = os.getenv('GROQ_API_KEY')
    
    if gemini_key and gemini_key != 'your_gemini_api_key_here':
        print("✅ Gemini API Key Found")
    else:
        print("❌ Gemini API Key Missing - Add to .env file")
        print("   Get it from: https://makersuite.google.com/app/apikey")
    
    if groq_key and groq_key != 'your_groq_api_key_here':
        print("✅ Groq API Key Found")
    else:
        print("⚠️  Groq API Key Missing (Optional)")
        
except Exception as e:
    print(f"❌ Environment Error: {e}")

# Test 2: Database Setup
print("\n[TEST 2] Testing Database...")
try:
    from models.database import init_db, SessionLocal, Brand
    
    # Initialize database
    init_db()
    print("✅ Database Created Successfully")
    
    # Test connection
    db = SessionLocal()
    test_brand = Brand(
        name="Test Brand",
        instagram_handle="testbrand",
        brand_profile={"test": True}
    )
    db.add(test_brand)
    db.commit()
    print("✅ Database Write Test Passed")
    
    # Read test
    brands = db.query(Brand).all()
    print(f"✅ Database Read Test Passed - {len(brands)} brand(s) found")
    db.close()
    
except Exception as e:
    print(f"❌ Database Error: {e}")

# Test 3: Instagram Scraper
print("\n[TEST 3] Testing Instagram Scraper...")
try:
    from scrapers.instagram_scraper import InstagramScraper
    
    scraper = InstagramScraper()
    print("✅ Instagram Scraper Initialized")
    
    # Test with a public brand (using Nike as example)
    print("📥 Scraping Instagram data (this may take 30-60 seconds)...")
    username = "nike"  # Public account for testing
    
    # Get profile data
    profile_data = scraper.scrape_profile(username)
    if profile_data:
        print(f"✅ Profile Scraped: @{profile_data['username']}")
        print(f"   Followers: {profile_data['followers']:,}")
        print(f"   Posts: {profile_data['posts_count']}")
    
    # Get recent posts
    posts_data = scraper.scrape_posts(username, max_posts=5)
    if posts_data:
        print(f"✅ Scraped {len(posts_data)} posts")
        print(f"   Latest post engagement: {posts_data[0]['engagement_rate']:.2f}%")
    
    # Save test data
    with open('test_scraped_data.json', 'w') as f:
        json.dump({
            'profile': profile_data,
            'posts': posts_data
        }, f, indent=2)
    print("✅ Test data saved to test_scraped_data.json")
    
except Exception as e:
    print(f"❌ Scraper Error: {e}")
    print("   Note: Instagram may rate limit. Try again in a few minutes.")

# Test 4: AI Brand Analyzer
print("\n[TEST 4] Testing AI Brand Analyzer...")
try:
    from agents.brand_analyzer import BrandAnalyzer
    
    analyzer = BrandAnalyzer()
    print("✅ Brand Analyzer Initialized")
    
    # Load test data
    if os.path.exists('test_scraped_data.json'):
        with open('test_scraped_data.json', 'r') as f:
            test_data = json.load(f)
        
        print("🤖 Analyzing brand profile with Gemini AI...")
        brand_data = {
            'profile': test_data['profile'],
            'posts': test_data['posts'],
            'brand_elements': {
                'top_hashtags': ['#justdoit', '#nike', '#sports']
            }
        }
        
        brand_profile = analyzer.analyze_brand_profile(brand_data)
        print("✅ Brand Profile Generated:")
        print(f"   Brand Voice: {brand_profile.get('brand_voice', 'N/A')}")
        print(f"   Target Audience: {brand_profile.get('target_audience', 'N/A')[:50]}...")
        
        # Save brand profile
        with open('test_brand_profile.json', 'w') as f:
            json.dump(brand_profile, f, indent=2)
        print("✅ Brand profile saved to test_brand_profile.json")
        
        # Test content generation
        print("\n🤖 Generating content ideas...")
        content_ideas = analyzer.generate_content_ideas(brand_profile, platform="instagram", count=3)
        if content_ideas:
            print(f"✅ Generated {len(content_ideas)} content ideas")
            print(f"   Idea 1: {content_ideas[0].get('title', 'N/A')}")
            
            # Save content ideas
            with open('test_content_ideas.json', 'w') as f:
                json.dump(content_ideas, f, indent=2)
            print("✅ Content ideas saved to test_content_ideas.json")
    else:
        print("⚠️  No scraped data found. Run scraper test first.")
        
except Exception as e:
    print(f"❌ AI Analyzer Error: {e}")
    print("   Check your GEMINI_API_KEY in .env file")

# Test Summary
print("\n" + "=" * 60)
print("📊 TEST SUMMARY")
print("=" * 60)
print("\nGenerated Files:")
print("  - test_scraped_data.json (Instagram data)")
print("  - test_brand_profile.json (AI brand analysis)")
print("  - test_content_ideas.json (AI content ideas)")
print("  - agency.db (SQLite database)")

print("\n✅ Testing Complete!")
print("\nNext Steps:")
print("1. Check the generated JSON files")
print("2. If all tests passed, proceed to build the API")
print("3. If any test failed, fix the issue and rerun")
print("\nRun: python test_system.py")
print("=" * 60)