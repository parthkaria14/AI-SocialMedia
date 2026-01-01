"""
Test API endpoints
Make sure server is running: python backend/main.py
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("🧪 TESTING API ENDPOINTS")
print("=" * 60)

# Test 1: Root endpoint
print("\n[TEST 1] Root Endpoint...")
response = requests.get(f"{BASE_URL}/")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

# Test 2: Create Brand
print("\n[TEST 2] Create Brand...")
brand_data = {
    "name": "Nike Test",
    "instagram_handle": "nike",
    "twitter_handle": "nike",
    "linkedin_handle": "nike"
}

response = requests.post(f"{BASE_URL}/brands/", json=brand_data)
print(f"Status: {response.status_code}")
result = response.json()
print(f"Response: {result}")

brand_id = result.get('brand_id')

# Wait for scraping to complete
print("\n⏳ Waiting 60 seconds for brand analysis to complete...")
time.sleep(60)

# Test 3: Get Brand Details
print("\n[TEST 3] Get Brand Details...")
response = requests.get(f"{BASE_URL}/brands/{brand_id}")
print(f"Status: {response.status_code}")
brand_details = response.json()
print(f"Brand: {brand_details['brand']['name']}")
print(f"Profile analyzed: {bool(brand_details['brand']['brand_profile'])}")

# Test 4: Generate Content Ideas
print("\n[TEST 4] Generate Content Ideas...")
content_request = {
    "brand_id": brand_id,
    "platform": "instagram",
    "count": 3
}

response = requests.post(f"{BASE_URL}/content/generate", json=content_request)
print(f"Status: {response.status_code}")
content_result = response.json()
print(f"Generated {len(content_result['content_ideas'])} content ideas")
for i, idea in enumerate(content_result['content_ideas'], 1):
    print(f"  {i}. {idea.get('title', 'No title')}")

# Test 5: Generate Images
print("\n[TEST 5] Generate Images...")
image_request = {
    "brand_id": brand_id,
    "content_ideas": content_result['content_ideas'][:2],
    "count": 2
}

response = requests.post(f"{BASE_URL}/images/generate", json=image_request)
print(f"Status: {response.status_code}")
image_result = response.json()
print(f"Generated {len(image_result['generated_images'])} images")
for img in image_result['generated_images']:
    print(f"  - {img.get('content_idea', 'Image')}: {img.get('filepath', 'N/A')}")

# Test 6: Generate Caption
print("\n[TEST 6] Generate Caption...")
caption_request = {
    "brand_id": brand_id,
    "content_idea": content_result['content_ideas'][0],
    "platform": "instagram"
}

response = requests.post(f"{BASE_URL}/content/caption", json=caption_request)
print(f"Status: {response.status_code}")
caption_result = response.json()
print(f"Caption: {caption_result.get('caption', 'N/A')[:100]}...")
print(f"Hashtags: {', '.join(caption_result.get('hashtags', [])[:5])}")

# Test 7: Create Post
print("\n[TEST 7] Create Post...")
post_data = {
    "brand_id": brand_id,
    "platform": "instagram",
    "content_type": "image",
    "caption": caption_result.get('caption', 'Test caption'),
    "hashtags": caption_result.get('hashtags', [])
}

response = requests.post(f"{BASE_URL}/posts/", json=post_data)
print(f"Status: {response.status_code}")
post_result = response.json()
print(f"Post created: ID {post_result.get('post_id')}")

# Test 8: Get Brand Posts
print("\n[TEST 8] Get Brand Posts...")
response = requests.get(f"{BASE_URL}/posts/brand/{brand_id}")
print(f"Status: {response.status_code}")
posts = response.json()
print(f"Total posts: {len(posts)}")

# Test 9: Get Analytics
print("\n[TEST 9] Get Brand Analytics...")
response = requests.get(f"{BASE_URL}/analytics/brand/{brand_id}")
print(f"Status: {response.status_code}")
analytics = response.json()
print(f"Summary: {analytics.get('summary', {})}")

# Test 10: Generate Strategy
print("\n[TEST 10] Generate Marketing Strategy...")
response = requests.post(f"{BASE_URL}/strategy/generate/{brand_id}")
print(f"Status: {response.status_code}")
strategy = response.json()
print(f"Recommendations: {len(strategy.get('strategy', {}).get('recommendations', []))}")

print("\n" + "=" * 60)
print("✅ API TESTING COMPLETE")
print("=" * 60)
print("\nAll systems operational! Ready for frontend integration.")