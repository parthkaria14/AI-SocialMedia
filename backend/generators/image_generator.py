import requests
from PIL import Image
from io import BytesIO
import os
from datetime import datetime
import time
from dotenv import load_dotenv

load_dotenv()

class ImageGenerator:
    """
    Generate images using free APIs
    """
    
    def __init__(self):
        self.output_dir = "data/generated_images"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def generate_with_pollinations(self, prompt, width=1024, height=1024):
        """
        Generate image using Pollinations.ai with API Key (Paid Tier)
        """
        try:
            # 1. Get your API Key (Best practice: Load from environment variable)
            # You can hardcode it here for testing, but env var is safer.
            api_key = os.environ.get("POLLINATIONS_API_KEY", "YOUR_API_KEY_HERE")
            
            # Debug: Check if key is loaded (shows first 8 chars only for security)
            print(f"[DEBUG] API Key loaded: {api_key[:8]}... (length: {len(api_key)})" if api_key else "[DEBUG] No API key found!")
            
            # 2. Pollinations API endpoint - PAID TIER uses gen.pollinations.ai
            url = f"https://gen.pollinations.ai/image/{requests.utils.quote(prompt)}"
            
            # 3. Configure parameters
            params = {
                "width": width,
                "height": height,
                "model": "kontext",  # Model to use
                "nologo": "true",
            }
            
            # 4. Add Authorization Header
            headers = {
                'Authorization': f'Bearer {api_key}',  # CRITICAL: This activates your paid credits
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            }
            
            # 5. Make the request
            # Note: For paid tiers, timeouts might need to be slightly longer for high-quality models
            response = requests.get(url, params=params, headers=headers, timeout=120)
            
            if response.status_code == 200:
                image = Image.open(BytesIO(response.content))
                
                # Save image locally
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"pollinations_premium_{timestamp}.png"
                filepath = os.path.join(self.output_dir, filename)
                image.save(filepath)
                
                return {
                    "success": True,
                    "filepath": filepath,
                    "filename": filename,
                    "prompt": prompt,
                    "model": "kontext" #gptimage
                }
            else:
                return {
                    "success": False, 
                    "error": f"Failed to generate: {response.status_code} - {response.text}"
                }
                
        except Exception as e:
            return {"success": False, "error": str(e)}    
    def generate_with_picsum(self, width=1080, height=1080, blur=0):
        """
        Get stock photos from Lorem Picsum (free)
        Good for placeholder images
        """
        try:
            url = f"https://picsum.photos/{width}/{height}"
            if blur > 0:
                url += f"?blur={blur}"
            
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                image = Image.open(BytesIO(response.content))
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"picsum_{timestamp}.jpg"
                filepath = os.path.join(self.output_dir, filename)
                image.save(filepath)
                
                return {
                    "success": True,
                    "filepath": filepath,
                    "filename": filename,
                    "type": "stock_photo"
                }
            else:
                return {"success": False, "error": "Failed to fetch image"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_text_image(self, text, brand_profile, size=(1080, 1080), bg_color=(255, 255, 255)):
        """
        Create simple text-based image for quotes, announcements
        """
        try:
            from PIL import ImageDraw, ImageFont
            
            # Create image
            image = Image.new('RGB', size, color=bg_color)
            draw = ImageDraw.Draw(image)
            
            # Try to use a nice font, fallback to default
            try:
                font = ImageFont.truetype("arial.ttf", 60)
                small_font = ImageFont.truetype("arial.ttf", 30)
            except:
                font = ImageFont.load_default()
                small_font = ImageFont.load_default()
            
            # Add text (centered)
            # Split text into lines
            words = text.split()
            lines = []
            current_line = []
            
            for word in words:
                test_line = ' '.join(current_line + [word])
                bbox = draw.textbbox((0, 0), test_line, font=font)
                if bbox[2] - bbox[0] < size[0] - 100:
                    current_line.append(word)
                else:
                    lines.append(' '.join(current_line))
                    current_line = [word]
            lines.append(' '.join(current_line))
            
            # Calculate position
            total_height = len(lines) * 80
            y = (size[1] - total_height) // 2
            
            for line in lines:
                bbox = draw.textbbox((0, 0), line, font=font)
                text_width = bbox[2] - bbox[0]
                x = (size[0] - text_width) // 2
                draw.text((x, y), line, fill=(0, 0, 0), font=font)
                y += 80
            
            # Add brand name at bottom
            brand_name = brand_profile.get('username', 'Brand')
            bbox = draw.textbbox((0, 0), f"@{brand_name}", font=small_font)
            brand_width = bbox[2] - bbox[0]
            draw.text(((size[0] - brand_width) // 2, size[1] - 100), 
                     f"@{brand_name}", fill=(128, 128, 128), font=small_font)
            
            # Save
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"text_{timestamp}.png"
            filepath = os.path.join(self.output_dir, filename)
            image.save(filepath)
            
            return {
                "success": True,
                "filepath": filepath,
                "filename": filename,
                "type": "text_image"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_social_post_image(self, content_idea, brand_profile):
        """
        Generate image based on content idea and brand profile
        """
        # Create detailed prompt from content idea
        title = content_idea.get('title', '')
        description = content_idea.get('description', '')
        brand_voice = brand_profile.get('brand_voice', 'professional')
        visual_style = brand_profile.get('visual_style', 'modern')
        
        prompt = f"{title}. {description}. Style: {visual_style}, {brand_voice}, high quality, professional photography, Instagram worthy"
        
        # Generate with Pollinations
        result = self.generate_with_pollinations(prompt)
        
        return result
    
    def batch_generate(self, content_ideas, brand_profile, count=5):
        """
        Generate multiple images for content ideas
        """
        results = []
        
        for i, idea in enumerate(content_ideas[:count]):
            result = self.generate_social_post_image(idea, brand_profile)
            result['content_idea'] = idea.get('title', f'Idea {i+1}')
            results.append(result)
            
            # Small delay to avoid rate limiting
            time.sleep(1)
        
        return results


# Test
if __name__ == "__main__":
    generator = ImageGenerator()
    
    # Test 1: Pollinations
    print("Testing Pollinations.ai...")
    result1 = generator.generate_with_pollinations(
        "Modern minimalist product photography, clean background, professional lighting"
    )
    print(f"Result: {result1}")
    
    # Test 2: Stock photo
    print("\nTesting Lorem Picsum...")
    result2 = generator.generate_with_picsum()
    print(f"Result: {result2}")
    
    # Test 3: Text image
    print("\nTesting text image...")
    brand_profile = {"username": "testbrand"}
    result3 = generator.create_text_image(
        "Your success is our mission",
        brand_profile
    )
    print(f"Result: {result3}")