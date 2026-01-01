import google.generativeai as genai
from groq import Groq
import os
import json
from dotenv import load_dotenv

load_dotenv()

class BrandAnalyzer:
    def __init__(self):
        # Primary: Gemini
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Backup: Groq
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.groq_model = "llama-3.3-70b-versatile"
    
    def _generate_content(self, prompt: str) -> str:
        """
        Generate content using Gemini with Groq fallback.
        Returns the raw text response.
        """
        # Try Gemini first
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as gemini_error:
            print(f"Gemini failed: {gemini_error}. Falling back to Groq...")
        
        # Fallback to Groq
        try:
            response = self.groq_client.chat.completions.create(
                model=self.groq_model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=4096
            )
            return response.choices[0].message.content.strip()
        except Exception as groq_error:
            print(f"Groq also failed: {groq_error}")
            raise Exception(f"Both Gemini and Groq failed. Gemini: {gemini_error}, Groq: {groq_error}")
    
    def _parse_json_response(self, result: str):
        """Parse JSON from AI response, handling markdown code blocks."""
        if result.startswith('```json'):
            result = result[7:-3]
        elif result.startswith('```'):
            result = result[3:-3]
        return json.loads(result)
    
    def analyze_brand_profile(self, brand_data):
        """
        Analyze brand identity from scraped data
        """
        profile = brand_data.get('profile', {})
        posts = brand_data.get('posts', [])[:10]  # Use top 10 posts
        brand_elements = brand_data.get('brand_elements', {})
        
        # Prepare data for analysis
        captions = [p.get('caption', '')[:200] for p in posts if p.get('caption')]
        top_hashtags = brand_elements.get('top_hashtags', [])[:10]
        
        prompt = f"""
Analyze this brand's social media presence and create a comprehensive brand profile:

BRAND: {profile.get('username')}
BIO: {profile.get('bio')}
FOLLOWERS: {profile.get('followers')}

RECENT POST CAPTIONS:
{chr(10).join(captions[:5])}

TOP HASHTAGS: {', '.join(top_hashtags)}

Please provide a detailed analysis in JSON format with these fields:
1. brand_voice: (casual/professional/humorous/inspirational/educational)
2. target_audience: (demographics and interests)
3. content_themes: (main topics they post about)
4. tone_characteristics: (adjectives describing their communication style)
5. key_messaging: (core messages and values)
6. visual_style: (description of typical content style)
7. posting_strategy: (observations about their approach)
8. competitor_positioning: (how they position themselves)
9. unique_selling_points: (what makes them unique)
10. content_pillars: (3-5 main content categories)

Return ONLY valid JSON, no markdown formatting.
"""
        
        try:
            result = self._generate_content(prompt)
            brand_profile = self._parse_json_response(result)
            return brand_profile
        except Exception as e:
            print(f"Error analyzing brand: {e}")
            return {
                "brand_voice": "professional",
                "target_audience": "general audience",
                "content_themes": ["general content"],
                "error": str(e)
            }
    
    def generate_content_ideas(self, brand_profile, platform="instagram", count=5):
        """
        Generate content ideas based on brand profile
        """
        prompt = f"""
Based on this brand profile, generate {count} creative content ideas for {platform}:

BRAND VOICE: {brand_profile.get('brand_voice')}
TARGET AUDIENCE: {brand_profile.get('target_audience')}
CONTENT THEMES: {', '.join(brand_profile.get('content_themes', []))}
CONTENT PILLARS: {', '.join(brand_profile.get('content_pillars', []))}

Generate content ideas that:
- Align with the brand voice and themes
- Engage the target audience
- Are suitable for {platform}
- Include a mix of educational, entertaining, and promotional content

Return as JSON array with format:
[
  {{
    "title": "content idea title",
    "description": "brief description",
    "content_type": "image/video/carousel",
    "caption_hook": "engaging opening line",
    "hashtag_suggestions": ["tag1", "tag2"]
  }}
]

Return ONLY valid JSON array, no markdown.
"""
        
        try:
            result = self._generate_content(prompt)
            ideas = self._parse_json_response(result)
            return ideas
        except Exception as e:
            print(f"Error generating ideas: {e}")
            return []
    
    def generate_caption(self, brand_profile, content_idea, platform="instagram"):
        """
        Generate caption for a specific content piece
        """
        prompt = f"""
Write a {platform} caption based on:

BRAND VOICE: {brand_profile.get('brand_voice')}
TARGET AUDIENCE: {brand_profile.get('target_audience')}
CONTENT IDEA: {content_idea.get('description')}

Requirements:
- Match the brand voice perfectly
- Include engaging hook
- 2-3 paragraphs
- Call-to-action
- 5-8 relevant hashtags
- Emojis if appropriate for brand

Return as JSON:
{{
  "caption": "full caption text",
  "hashtags": ["tag1", "tag2"],
  "cta": "call to action"
}}

Return ONLY valid JSON, no markdown.
"""
        
        try:
            result = self._generate_content(prompt)
            caption_data = self._parse_json_response(result)
            return caption_data
        except Exception as e:
            print(f"Error generating caption: {e}")
            return {
                "caption": content_idea.get('caption_hook', ''),
                "hashtags": content_idea.get('hashtag_suggestions', []),
                "cta": "Check it out!"
            }
    
    def analyze_performance(self, posts_analytics):
        """
        Analyze post performance and provide recommendations
        """
        if not posts_analytics:
            return {}
        
        avg_engagement = sum(p.get('engagement_rate', 0) for p in posts_analytics) / len(posts_analytics)
        
        # Get best and worst performing posts
        sorted_posts = sorted(posts_analytics, key=lambda x: x.get('engagement_rate', 0), reverse=True)
        best_posts = sorted_posts[:3]
        worst_posts = sorted_posts[-3:]
        
        prompt = f"""
Analyze this social media performance data:

AVERAGE ENGAGEMENT RATE: {avg_engagement:.2f}%

TOP PERFORMING POSTS:
{chr(10).join([f"- {p.get('caption', '')[:100]} (Engagement: {p.get('engagement_rate', 0):.2f}%)" for p in best_posts])}

LOWEST PERFORMING POSTS:
{chr(10).join([f"- {p.get('caption', '')[:100]} (Engagement: {p.get('engagement_rate', 0):.2f}%)" for p in worst_posts])}

Provide actionable insights:
1. What patterns make top posts successful?
2. What should be avoided based on low performers?
3. 3 specific recommendations to improve engagement
4. Content strategy adjustments

Return as JSON:
{{
  "success_patterns": ["pattern1", "pattern2"],
  "avoid_patterns": ["pattern1", "pattern2"],
  "recommendations": ["rec1", "rec2", "rec3"],
  "strategy_adjustments": "detailed strategy advice"
}}

Return ONLY valid JSON, no markdown.
"""
        
        try:
            result = self._generate_content(prompt)
            analysis = self._parse_json_response(result)
            return analysis
        except Exception as e:
            print(f"Error analyzing performance: {e}")
            return {}


# Quick Test
if __name__ == "__main__":
    analyzer = BrandAnalyzer()
    
    # Test brand profile analysis
    test_data = {
        "profile": {
            "username": "testbrand",
            "bio": "Sustainable fashion for the modern individual",
            "followers": 50000
        },
        "posts": [
            {"caption": "New collection drop! Sustainable materials meet modern design."},
            {"caption": "Behind the scenes of our eco-friendly manufacturing process."}
        ],
        "brand_elements": {
            "top_hashtags": ["#sustainablefashion", "#ecofriendly", "#slowfashion"]
        }
    }
    
    profile = analyzer.analyze_brand_profile(test_data)
    print("Brand Profile:", json.dumps(profile, indent=2))