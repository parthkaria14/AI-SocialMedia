"""
Social Media Posting Module
Handles posting to Instagram, Twitter, LinkedIn
"""

from instagrapi import Client as InstaClient
import tweepy
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()


class InstagramPoster:
    """Post to Instagram using instagrapi"""
    
    def __init__(self, username=None, password=None):
        self.username = username or os.getenv('INSTAGRAM_USERNAME')
        self.password = password or os.getenv('INSTAGRAM_PASSWORD')
        self.client = None
    
    def login(self):
        """Login to Instagram"""
        try:
            self.client = InstaClient()
            self.client.login(self.username, self.password)
            return True
        except Exception as e:
            print(f"Instagram login failed: {e}")
            return False
    
    def post_photo(self, image_path, caption, hashtags=None):
        """Post a photo to Instagram"""
        if not self.client:
            if not self.login():
                return {"success": False, "error": "Login failed"}
        
        try:
            # Combine caption and hashtags
            full_caption = caption
            if hashtags:
                full_caption += "\n\n" + " ".join([f"#{tag}" for tag in hashtags])
            
            # Upload photo
            media = self.client.photo_upload(image_path, full_caption)
            
            return {
                "success": True,
                "post_id": media.pk,
                "url": f"https://www.instagram.com/p/{media.code}/"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def post_video(self, video_path, caption, hashtags=None):
        """Post a video to Instagram"""
        if not self.client:
            if not self.login():
                return {"success": False, "error": "Login failed"}
        
        try:
            full_caption = caption
            if hashtags:
                full_caption += "\n\n" + " ".join([f"#{tag}" for tag in hashtags])
            
            media = self.client.video_upload(video_path, full_caption)
            
            return {
                "success": True,
                "post_id": media.pk,
                "url": f"https://www.instagram.com/p/{media.code}/"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


class TwitterPoster:
    """Post to Twitter using tweepy"""
    
    def __init__(self):
        self.api_key = os.getenv('TWITTER_API_KEY')
        self.api_secret = os.getenv('TWITTER_API_SECRET')
        self.access_token = os.getenv('TWITTER_ACCESS_TOKEN')
        self.access_secret = os.getenv('TWITTER_ACCESS_SECRET')
        self.client = None
        self.api = None
    
    def authenticate(self):
        """Authenticate with Twitter API"""
        try:
            # OAuth 1.0a for API v1.1
            auth = tweepy.OAuthHandler(self.api_key, self.api_secret)
            auth.set_access_token(self.access_token, self.access_secret)
            self.api = tweepy.API(auth)
            
            # OAuth 2.0 for API v2
            self.client = tweepy.Client(
                consumer_key=self.api_key,
                consumer_secret=self.api_secret,
                access_token=self.access_token,
                access_token_secret=self.access_secret
            )
            
            return True
        except Exception as e:
            print(f"Twitter authentication failed: {e}")
            return False
    
    def post_tweet(self, text, image_path=None):
        """Post a tweet with optional image"""
        if not self.client:
            if not self.authenticate():
                return {"success": False, "error": "Authentication failed"}
        
        try:
            media_ids = []
            
            # Upload image if provided
            if image_path and self.api:
                media = self.api.media_upload(image_path)
                media_ids = [media.media_id]
            
            # Post tweet
            response = self.client.create_tweet(
                text=text,
                media_ids=media_ids if media_ids else None
            )
            
            tweet_id = response.data['id']
            
            return {
                "success": True,
                "post_id": tweet_id,
                "url": f"https://twitter.com/user/status/{tweet_id}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


class LinkedInPoster:
    """Post to LinkedIn (simplified - requires proper OAuth)"""
    
    def __init__(self):
        self.email = os.getenv('LINKEDIN_EMAIL')
        self.password = os.getenv('LINKEDIN_PASSWORD')
    
    def post_update(self, text, image_path=None):
        """
        Post to LinkedIn
        Note: This is a placeholder. Proper implementation needs LinkedIn OAuth
        """
        # LinkedIn API requires proper OAuth flow
        # For demo purposes, we'll return a simulated response
        
        return {
            "success": False,
            "error": "LinkedIn posting requires OAuth setup. See documentation."
        }


class SocialMediaScheduler:
    """
    Main scheduler class to manage posts across platforms
    """
    
    def __init__(self):
        self.instagram = InstagramPoster()
        self.twitter = TwitterPoster()
        self.linkedin = LinkedInPoster()
    
    def post_to_platform(self, platform, content_type, caption, hashtags=None, media_path=None):
        """
        Post content to specified platform
        """
        result = {"platform": platform, "posted_at": datetime.utcnow().isoformat()}
        
        if platform.lower() == "instagram":
            if content_type == "image" and media_path:
                result.update(self.instagram.post_photo(media_path, caption, hashtags))
            elif content_type == "video" and media_path:
                result.update(self.instagram.post_video(media_path, caption, hashtags))
            else:
                result.update({"success": False, "error": "Media path required for Instagram"})
        
        elif platform.lower() == "twitter":
            # Twitter has character limit
            if len(caption) > 280:
                caption = caption[:277] + "..."
            result.update(self.twitter.post_tweet(caption, media_path))
        
        elif platform.lower() == "linkedin":
            result.update(self.linkedin.post_update(caption, media_path))
        
        else:
            result.update({"success": False, "error": f"Unknown platform: {platform}"})
        
        return result
    
    def schedule_post(self, post_data):
        """
        Schedule a post for future publishing
        This would integrate with Celery for actual scheduling
        """
        # For now, just validate the data
        required_fields = ['platform', 'content_type', 'caption']
        
        for field in required_fields:
            if field not in post_data:
                return {"success": False, "error": f"Missing required field: {field}"}
        
        return {
            "success": True,
            "message": "Post scheduled successfully",
            "scheduled_time": post_data.get('scheduled_time', 'immediate')
        }


# Test functions
if __name__ == "__main__":
    scheduler = SocialMediaScheduler()
    
    # Test data
    test_post = {
        "platform": "twitter",
        "content_type": "text",
        "caption": "Testing AI Social Media Agency! 🚀 #AI #SocialMedia",
        "hashtags": ["AI", "SocialMedia", "Automation"]
    }
    
    print("Testing social media posting...")
    print("\nNote: Set credentials in .env file to test actual posting")
    print("\nScheduling test:", scheduler.schedule_post(test_post))