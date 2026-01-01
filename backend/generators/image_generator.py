import requests
from PIL import Image
from io import BytesIO
import os
from datetime import datetime
import time

class ImageGenerator:
    """
    Generate images using free APIs
    """
    
    def __init__(self):
        self.output_dir = "data/generated_images"
        os.makedirs(self.output_dir, exist_ok=True)
        self.pollinations_api_key = os.getenv('POLLINATIONS_API_KEY', '')
        self.base_url = "https://image.pollinations.ai"
    
    def generate_with_pollinations(self, prompt, width=1024, height=1024):
        """
        Generate image using Pollinations.ai
        Fixed to properly handle their API responses
        """
        try:
            # Clean and encode prompt
            clean_prompt = prompt.replace('\n', ' ').strip()
            
            # Remove any instructions about no text/watermark from prompt as it causes issues
            clean_prompt = clean_prompt.replace('no text', '').replace('no watermark', '').strip()
            
            # Build URL
            url = f"{self.base_url}/prompt/{requests.utils.quote(clean_prompt)}"
            
            params = {
                "width": str(width),
                "height": str(height),
                "seed": "-1",
                "model": "flux",
                "nologo": "true",
                "enhance": "false",
                "private": "false"
            }
            
            print(f"Generating image...")
            print(f"Prompt: {clean_prompt[:100]}...")
            
            # Make request with proper headers
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
            
            response = requests.get(
                url,
                params=params,
                headers=headers,
                timeout=120,
                allow_redirects=True,
                stream=True
            )
            
            print(f"Status: {response.status_code}")
            content_type = response.headers.get('content-type', '')
            print(f"Content-Type: {content_type}")
            
            if response.status_code == 200 and 'image' in content_type:
                # Load image
                image = Image.open(BytesIO(response.content))
                
                # Save image
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"pollinations_{timestamp}.png"
                filepath = os.path.join(self.output_dir, filename)
                image.save(filepath)
                
                print(f"✅ Image saved: {filepath}")
                
                return {
                    "success": True,
                    "filepath": filepath,
                    "url": response.url,
                    "prompt": prompt
                }
            else:
                error_msg = f"Failed: {response.status_code}, Content-Type: {content_type}"
                if 'html' in content_type:
                    error_msg += " (Got HTML instead of image - API might be down)"
                print(f"❌ {error_msg}")
                return {"success": False, "error": error_msg}
                
        except Exception as e:
            print(f"❌ Exception: {e}")
            import traceback
            traceback.print_exc()
            return {"success": False, "error": str(e)}
    
    def generate_with_huggingface(self, prompt, width=1024, height=1024):
        """
        Alternative: Generate using Hugging Face Inference API (free tier)
        Model: stabilityai/stable-diffusion-2-1
        """
        try:
            API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1"
            
            headers = {}
            hf_token = os.getenv('HUGGINGFACE_TOKEN')
            if hf_token:
                headers["Authorization"] = f"Bearer {hf_token}"
            
            payload = {
                "inputs": prompt,
                "parameters": {
                    "width": width,
                    "height": height,
                }
            }
            
            response = requests.post(API_URL, headers=headers, json=payload, timeout=90)
            
            if response.status_code == 200:
                image = Image.open(BytesIO(response.content))
                
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"huggingface_{timestamp}.png"
                filepath = os.path.join(self.output_dir, filename)
                image.save(filepath)
                
                return {
                    "success": True,
                    "filepath": filepath,
                    "prompt": prompt,
                    "source": "huggingface"
                }
            else:
                return {"success": False, "error": f"HuggingFace API error: {response.status_code}"}
                
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
                    "url": url,
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
                "type": "text_image"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def generate_social_post_image(self, content_idea, brand_profile):
        """
        Generate image based on content idea and brand profile
        Tries Pollinations first, falls back to HuggingFace if needed
        """
        # Create detailed prompt from content idea
        title = content_idea.get('title', '')
        description = content_idea.get('description', '')
        brand_voice = brand_profile.get('brand_voice', 'professional')
        visual_style = brand_profile.get('visual_style', 'modern')
        
        prompt = f"{title}. {description}. Style: {visual_style}, {brand_voice}, high quality, professional photography, Instagram worthy, no text, no watermark"
        
        # Try Pollinations first
        result = self.generate_with_pollinations(prompt)
        
        # If Pollinations fails, try HuggingFace
        if not result.get('success'):
            print("Pollinations failed, trying HuggingFace...")
            result = self.generate_with_huggingface(prompt)
        
        # If both fail, create a text-based image
        if not result.get('success'):
            print("All image generation failed, creating text image...")
            result = self.create_text_image(title, brand_profile)
        
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
        
        return results


# Test
if __name__ == "__main__":
    generator = ImageGenerator()
    
    # Test 1: Pollinations with retry
    print("=" * 60)
    print("Testing Pollinations.ai Image Generation")
    print("=" * 60)
    
    test_prompt = "A modern minimalist product photography of a sleek laptop on a clean white desk, professional lighting, high quality, 4k"
    
    print(f"\nPrompt: {test_prompt}\n")
    
    result1 = generator.generate_with_pollinations(test_prompt, 1024, 1024)
    print(f"\nResult: {result1}")
    
    if not result1.get('success'):
        print("\n⚠️  Pollinations failed, trying HuggingFace...")
        result2 = generator.generate_with_huggingface(test_prompt, 1024, 1024)
        print(f"HuggingFace Result: {result2}")
    
    # Test 2: Stock photo
    print("\n" + "=" * 60)
    print("Testing Lorem Picsum (Stock Photos)")
    print("=" * 60)
    result3 = generator.generate_with_picsum(1080, 1080)
    print(f"Result: {result3}")
    
    # Test 3: Text image
    print("\n" + "=" * 60)
    print("Testing Text Image Generation")
    print("=" * 60)
    brand_profile = {"username": "testbrand"}
    result4 = generator.create_text_image(
        "Your Success Is Our Mission",
        brand_profile
    )
    print(f"Result: {result4}")