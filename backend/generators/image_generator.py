import requests
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
from io import BytesIO
import os
from datetime import datetime
import textwrap

class ImageGenerator:
    """
    Generate images using free APIs with enhanced prompts and text overlays
    """
    
    def __init__(self):
        self.output_dir = "data/generated_images"
        os.makedirs(self.output_dir, exist_ok=True)
    
    def _create_enhanced_prompt(self, base_prompt, brand_profile, content_idea):
        """
        Create detailed, high-quality prompt for image generation
        """
        visual_style = brand_profile.get('visual_style', 'modern and professional')
        brand_voice = brand_profile.get('brand_voice', 'professional')
        content_type = content_idea.get('content_type', 'image')
        
        # Enhanced prompt structure
        style_keywords = {
            'professional': 'corporate, clean, minimalist, high-end photography',
            'casual': 'lifestyle, candid, natural lighting, relatable',
            'humorous': 'playful, vibrant colors, fun, engaging',
            'inspirational': 'dramatic lighting, aspirational, cinematic',
            'educational': 'clean, informative, clear, organized'
        }
        
        style = style_keywords.get(brand_voice, 'professional, high-quality')
        
        enhanced_prompt = f"""
{base_prompt}
Style: {style}, {visual_style}
Quality: professional photography, 4K, sharp focus, perfect lighting, commercially viable
Composition: rule of thirds, balanced, Instagram-worthy
Colors: vibrant yet natural, brand-appropriate color scheme
NO text, NO watermarks, NO logos in the image
Commercial stock photo quality
        """.strip()
        
        return enhanced_prompt
    
    def generate_with_pollinations(self, prompt, width=1080, height=1080, enhance=True):
        """
        Generate image using Pollinations.ai with enhanced prompts
        """
        try:
            # Add quality enhancers to prompt
            if enhance:
                quality_terms = "professional photography, high quality, 4K resolution, sharp focus, perfect composition"
                prompt = f"{prompt}, {quality_terms}"
            
            # Pollinations API endpoint
            url = f"https://image.pollinations.ai/prompt/{requests.utils.quote(prompt)}"
            params = {
                "width": width,
                "height": height,
                "nologo": "true",
                "enhance": "true"
            }
            
            response = requests.get(url, params=params, timeout=60)
            
            if response.status_code == 200:
                image = Image.open(BytesIO(response.content))
                
                # Save image
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"pollinations_{timestamp}.png"
                filepath = os.path.join(self.output_dir, filename)
                image.save(filepath)
                
                return {
                    "success": True,
                    "filepath": filepath,
                    "url": url,
                    "prompt": prompt,
                    "image": image
                }
            else:
                return {"success": False, "error": "Failed to generate image"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def add_text_overlay(self, image, text, position='bottom', brand_name=None, language='english'):
        """
        Add professional text overlay to image
        Supports English and Hindi text
        """
        try:
            # Create a copy to avoid modifying original
            img = image.copy()
            
            # Add semi-transparent overlay for better text readability
            overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
            draw = ImageDraw.Draw(overlay)
            
            # Create gradient overlay at bottom
            if position == 'bottom':
                for i in range(200):
                    alpha = int((i / 200) * 180)
                    draw.rectangle(
                        [(0, img.size[1] - 200 + i), (img.size[0], img.size[1] - 200 + i + 1)],
                        fill=(0, 0, 0, alpha)
                    )
            elif position == 'top':
                for i in range(200):
                    alpha = int(((200 - i) / 200) * 180)
                    draw.rectangle(
                        [(0, i), (img.size[0], i + 1)],
                        fill=(0, 0, 0, alpha)
                    )
            
            # Composite overlay
            img = Image.alpha_composite(img.convert('RGBA'), overlay)
            draw = ImageDraw.Draw(img)
            
            # Load fonts
            try:
                # Try to load better fonts
                if language == 'hindi':
                    # For Hindi, try to use a font that supports Devanagari
                    try:
                        font_large = ImageFont.truetype("arial.ttf", 70)
                        font_small = ImageFont.truetype("arial.ttf", 40)
                    except:
                        font_large = ImageFont.load_default()
                        font_small = ImageFont.load_default()
                else:
                    try:
                        font_large = ImageFont.truetype("arialbd.ttf", 70)  # Bold
                        font_small = ImageFont.truetype("arial.ttf", 40)
                    except:
                        try:
                            font_large = ImageFont.truetype("Arial-Bold.ttf", 70)
                            font_small = ImageFont.truetype("Arial.ttf", 40)
                        except:
                            font_large = ImageFont.load_default()
                            font_small = ImageFont.load_default()
            except:
                font_large = ImageFont.load_default()
                font_small = ImageFont.load_default()
            
            # Wrap text to fit width
            max_width = img.size[0] - 100
            wrapped_lines = []
            words = text.split()
            current_line = []
            
            for word in words:
                test_line = ' '.join(current_line + [word])
                bbox = draw.textbbox((0, 0), test_line, font=font_large)
                if bbox[2] - bbox[0] < max_width:
                    current_line.append(word)
                else:
                    if current_line:
                        wrapped_lines.append(' '.join(current_line))
                    current_line = [word]
            
            if current_line:
                wrapped_lines.append(' '.join(current_line))
            
            # Limit to 3 lines
            wrapped_lines = wrapped_lines[:3]
            
            # Calculate text position
            if position == 'bottom':
                y_start = img.size[1] - 180 - (len(wrapped_lines) * 80)
            else:
                y_start = 50
            
            # Draw text with shadow for better readability
            for i, line in enumerate(wrapped_lines):
                bbox = draw.textbbox((0, 0), line, font=font_large)
                text_width = bbox[2] - bbox[0]
                x = (img.size[0] - text_width) // 2
                y = y_start + (i * 80)
                
                # Shadow
                draw.text((x + 3, y + 3), line, fill=(0, 0, 0, 200), font=font_large)
                # Main text
                draw.text((x, y), line, fill=(255, 255, 255, 255), font=font_large)
            
            # Add brand name if provided
            if brand_name:
                brand_text = f"@{brand_name}"
                bbox = draw.textbbox((0, 0), brand_text, font=font_small)
                brand_width = bbox[2] - bbox[0]
                brand_x = (img.size[0] - brand_width) // 2
                brand_y = img.size[1] - 60 if position == 'bottom' else y_start + len(wrapped_lines) * 80 + 20
                
                # Shadow
                draw.text((brand_x + 2, brand_y + 2), brand_text, fill=(0, 0, 0, 200), font=font_small)
                # Main text
                draw.text((brand_x, brand_y), brand_text, fill=(200, 200, 200, 255), font=font_small)
            
            # Convert back to RGB
            img = img.convert('RGB')
            
            return img
            
        except Exception as e:
            print(f"Error adding text overlay: {e}")
            return image.convert('RGB')
    
    def generate_social_post_image(self, content_idea, brand_profile, add_text=True, language='english'):
        """
        Generate high-quality image for social media post with optional text overlay
        """
        title = content_idea.get('title', '')
        description = content_idea.get('description', '')
        brand_voice = brand_profile.get('brand_voice', 'professional')
        visual_style = brand_profile.get('visual_style', 'modern')
        brand_name = brand_profile.get('username', '')
        
        # Create highly detailed prompt
        base_prompt = f"{description}"
        enhanced_prompt = self._create_enhanced_prompt(base_prompt, brand_profile, content_idea)
        
        # Generate base image
        result = self.generate_with_pollinations(enhanced_prompt, width=1080, height=1080)
        
        if result.get('success') and add_text and result.get('image'):
            # Add text overlay
            image_with_text = self.add_text_overlay(
                result['image'],
                title,
                position='bottom',
                brand_name=brand_name,
                language=language
            )
            
            # Save the image with text
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"post_{timestamp}.png"
            filepath = os.path.join(self.output_dir, filename)
            image_with_text.save(filepath, quality=95)
            
            result['filepath'] = filepath
            result['has_text_overlay'] = True
        
        return result
    
    def generate_from_custom_prompt(self, custom_prompt, brand_profile, title=None, add_text=True, language='english'):
        """
        Generate image from custom user prompt with enhancements
        """
        brand_voice = brand_profile.get('brand_voice', 'professional')
        brand_name = brand_profile.get('username', '')
        
        # Enhance custom prompt
        content_idea = {'content_type': 'image'}
        enhanced_prompt = self._create_enhanced_prompt(custom_prompt, brand_profile, content_idea)
        
        # Generate image
        result = self.generate_with_pollinations(enhanced_prompt, width=1080, height=1080)
        
        if result.get('success') and add_text and title and result.get('image'):
            # Add text overlay
            image_with_text = self.add_text_overlay(
                result['image'],
                title,
                position='bottom',
                brand_name=brand_name,
                language=language
            )
            
            # Save
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"custom_{timestamp}.png"
            filepath = os.path.join(self.output_dir, filename)
            image_with_text.save(filepath, quality=95)
            
            result['filepath'] = filepath
            result['has_text_overlay'] = True
        
        return result
    
    def batch_generate(self, content_ideas, brand_profile, count=5, add_text=True, language='english'):
        """
        Generate multiple high-quality images for content ideas
        """
        results = []
        
        for i, idea in enumerate(content_ideas[:count]):
            result = self.generate_social_post_image(idea, brand_profile, add_text=add_text, language=language)
            result['content_idea'] = idea.get('title', f'Idea {i+1}')
            results.append(result)
        
        return results


# Test
if __name__ == "__main__":
    generator = ImageGenerator()
    
    # Test enhanced generation
    print("Testing enhanced image generation...")
    brand_profile = {
        "username": "testbrand",
        "brand_voice": "professional",
        "visual_style": "modern minimalist"
    }
    
    content_idea = {
        "title": "Summer Collection 2024",
        "description": "Vibrant summer fashion collection with floral patterns",
        "content_type": "image"
    }
    
    result = generator.generate_social_post_image(content_idea, brand_profile, add_text=True)
    print(f"Result: {result}")