import sys
import os

# Add the project backend to sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(script_dir, '..'))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from database import SessionLocal, InstagramPost, Brand

db = SessionLocal()
try:
    post_count = db.query(InstagramPost).count()
    print(f"Total InstagramPost records: {post_count}")
    
    brands = db.query(Brand).all()
    for brand in brands:
        count = db.query(InstagramPost).filter(InstagramPost.brand_id == brand.id).count()
        print(f"Brand ID {brand.id} ({brand.name}): {count} posts")
        
    posts = db.query(InstagramPost).limit(5).all()
    for post in posts:
        print(f"Post ID {post.id}, Brand ID {post.brand_id}, Shortcode {post.shortcode}")
finally:
    db.close()
