import instaloader
from datetime import datetime
import json

class InstagramScraper:
    def __init__(self):
        self.loader = instaloader.Instaloader()
        
    def scrape_profile(self, username, max_posts=50):
        """
        Scrape Instagram profile data
        """
        try:
            profile = instaloader.Profile.from_username(self.loader.context, username)
            
            profile_data = {
                "username": profile.username,
                "full_name": profile.full_name,
                "bio": profile.biography,
                "followers": profile.followers,
                "following": profile.followees,
                "posts_count": profile.mediacount,
                "is_verified": profile.is_verified,
                "is_private": profile.is_private,
                "profile_pic_url": profile.profile_pic_url,
                "external_url": profile.external_url
            }
            
            return profile_data
        except Exception as e:
            print(f"Error scraping profile: {e}")
            return None
    
    def scrape_posts(self, username, max_posts=50):
        """
        Scrape recent posts from Instagram profile
        """
        try:
            profile = instaloader.Profile.from_username(self.loader.context, username)
            posts_data = []
            
            for idx, post in enumerate(profile.get_posts()):
                if idx >= max_posts:
                    break
                
                post_data = {
                    "post_id": post.shortcode,
                    "url": f"https://instagram.com/p/{post.shortcode}/",
                    "caption": post.caption if post.caption else "",
                    "likes": post.likes,
                    "comments": post.comments,
                    "timestamp": post.date_utc.isoformat(),
                    "is_video": post.is_video,
                    "media_url": post.url,
                    "hashtags": post.caption_hashtags if post.caption else [],
                    "mentions": post.caption_mentions if post.caption else [],
                    "location": post.location.name if post.location else None
                }
                
                # Calculate engagement rate
                engagement = post.likes + post.comments
                followers = profile.followers
                post_data["engagement_rate"] = (engagement / followers * 100) if followers > 0 else 0
                
                posts_data.append(post_data)
            
            return posts_data
        except Exception as e:
            print(f"Error scraping posts: {e}")
            return []
    
    def analyze_posting_patterns(self, posts_data):
        """
        Analyze best posting times and frequency
        """
        if not posts_data:
            return {}
        
        posting_hours = {}
        posting_days = {}
        
        for post in posts_data:
            dt = datetime.fromisoformat(post['timestamp'].replace('Z', '+00:00'))
            hour = dt.hour
            day = dt.strftime('%A')
            
            posting_hours[hour] = posting_hours.get(hour, 0) + 1
            posting_days[day] = posting_days.get(day, 0) + 1
        
        # Find best performing times
        best_hours = sorted(posting_hours.items(), key=lambda x: x[1], reverse=True)[:3]
        best_days = sorted(posting_days.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Calculate average engagement
        avg_likes = sum(p['likes'] for p in posts_data) / len(posts_data)
        avg_comments = sum(p['comments'] for p in posts_data) / len(posts_data)
        avg_engagement = sum(p['engagement_rate'] for p in posts_data) / len(posts_data)
        
        return {
            "best_posting_hours": [h[0] for h in best_hours],
            "best_posting_days": [d[0] for d in best_days],
            "average_likes": avg_likes,
            "average_comments": avg_comments,
            "average_engagement_rate": avg_engagement,
            "posting_frequency": len(posts_data)
        }
    
    def extract_brand_elements(self, posts_data):
        """
        Extract brand elements like common hashtags, topics, style
        """
        if not posts_data:
            return {}
        
        all_hashtags = []
        all_captions = []
        
        for post in posts_data:
            all_hashtags.extend(post.get('hashtags', []))
            if post.get('caption'):
                all_captions.append(post['caption'])
        
        # Count hashtag frequency
        hashtag_freq = {}
        for tag in all_hashtags:
            hashtag_freq[tag] = hashtag_freq.get(tag, 0) + 1
        
        top_hashtags = sorted(hashtag_freq.items(), key=lambda x: x[1], reverse=True)[:20]
        
        return {
            "top_hashtags": [h[0] for h in top_hashtags],
            "total_posts_analyzed": len(posts_data),
            "captions_sample": all_captions[:10],  # Sample for AI analysis
            "has_videos": sum(1 for p in posts_data if p.get('is_video', False)),
            "has_images": sum(1 for p in posts_data if not p.get('is_video', False))
        }
    
    def get_complete_brand_data(self, username, max_posts=50):
        """
        Get complete brand data in one call
        """
        profile_data = self.scrape_profile(username)
        if not profile_data:
            return None
        
        posts_data = self.scrape_posts(username, max_posts)
        posting_patterns = self.analyze_posting_patterns(posts_data)
        brand_elements = self.extract_brand_elements(posts_data)
        
        return {
            "profile": profile_data,
            "posts": posts_data,
            "patterns": posting_patterns,
            "brand_elements": brand_elements,
            "scraped_at": datetime.utcnow().isoformat()
        }


# Quick Test
if __name__ == "__main__":
    scraper = InstagramScraper()
    # Test with a public brand account
    data = scraper.get_complete_brand_data("nike", max_posts=10)
    print(json.dumps(data, indent=2))