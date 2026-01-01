"""
Alternative Pollinations.ai implementation
Using their latest API properly
"""

import requests
import base64
from io import BytesIO
from PIL import Image
import os
from datetime import datetime
import time

class PollinationsV2:
    """
    Pollinations.ai image generation
    Properly handles their redirect-based API
    """
    
    def __init__(self):
        self.output_dir = "data/generated_images"
        os.makedirs(self.output_dir, exist_ok=True)
        self.base_url = "https://image.pollinations.ai"
    
    def generate_image(self, prompt, width=1024, height=1024, model="flux"):
        """
        Generate image using Pollinations.ai
        Their API returns a redirect to the actual image
        """
        try:
            # Clean prompt
            clean_prompt = prompt.strip().replace('\n', ' ')
            
            # Build URL - they use a simple structure
            url = f"{self.base_url}/prompt/{requests.utils.quote(clean_prompt)}"
            
            # Parameters
            params = {
                "width": str(width),
                "height": str(height),
                "model": model,
                "nologo": "true",
                "enhance": "false",  # Disable for faster generation
                "private": "false"
            }
            
            print(f"Requesting image: {url}")
            print(f"Params: {params}")
            
            # Make request with redirects enabled
            response = requests.get(
                url, 
                params=params, 
                timeout=120,
                allow_redirects=True,
                stream=True
            )
            
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('content-type')}")
            print(f"Final URL: {response.url}")
            
            if response.status_code == 200:
                # Verify it's an image
                content_type = response.headers.get('content-type', '')
                
                if 'image' in content_type:
                    # Load and save image
                    image_data = BytesIO(response.content)
                    image = Image.open(image_data)
                    
                    # Save
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"pollinations_{timestamp}.png"
                    filepath = os.path.join(self.output_dir, filename)
                    image.save(filepath)
                    
                    return {
                        "success": True,
                        "filepath": filepath,
                        "url": response.url,
                        "prompt": prompt
                    }
                else:
                    # Not an image, might be HTML or error page
                    print(f"Response is not an image. First 200 chars: {response.text[:200]}")
                    return {
                        "success": False,
                        "error": "Response is not an image (got HTML/text instead)"
                    }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}"
                }
                
        except Exception as e:
            print(f"Error generating image: {e}")
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e)
            }
    
    def generate_with_retry(self, prompt, width=1024, height=1024, retries=3):
        """
        Generate with automatic retry on failure
        """
        for attempt in range(retries):
            print(f"Attempt {attempt + 1}/{retries}")
            result = self.generate_image(prompt, width, height)
            
            if result.get('success'):
                return result
            
            if attempt < retries - 1:
                wait_time = (attempt + 1) * 2  # 2, 4, 6 seconds
                print(f"Failed, retrying in {wait_time}s...")
                time.sleep(wait_time)
        
        return result


# Test
if __name__ == "__main__":
    gen = PollinationsV2()
    
    print("Testing Pollinations V2...")
    result = gen.generate_with_retry(
        "A professional product photo of a modern laptop on a clean desk, minimalist style, high quality",
        width=1024,
        height=1024
    )
    
    print("\nResult:", result)
    
    if result.get('success'):
        print(f"✅ Image saved to: {result['filepath']}")
    else:
        print(f"❌ Failed: {result.get('error')}")