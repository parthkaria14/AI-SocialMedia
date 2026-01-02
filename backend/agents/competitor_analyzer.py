"""
Competitor Analysis Agent
Analyzes competitors and provides strategic insights
"""

import google.generativeai as genai
from groq import Groq
import os
import json
from dotenv import load_dotenv
from scrapers.instagram_scraper import InstagramScraper

load_dotenv()

class CompetitorAnalyzer:
    def __init__(self):
        # Primary: Gemini
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Backup: Groq
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.groq_model = "openai/gpt-oss-120b"
        
        self.scraper = InstagramScraper()
    
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
    
    def analyze_competitor(self, competitor_handle, max_posts=20):
        """
        Analyze a single competitor's social media presence
        """
        # Scrape competitor data
        competitor_data = self.scraper.get_complete_brand_data(competitor_handle, max_posts=max_posts)
        
        if not competitor_data:
            return {"success": False, "error": "Failed to scrape competitor data"}
        
        profile = competitor_data.get('profile', {})
        posts = competitor_data.get('posts', [])
        patterns = competitor_data.get('patterns', {})
        elements = competitor_data.get('brand_elements', {})
        
        # Extract key metrics
        avg_engagement = patterns.get('average_engagement_rate', 0)
        avg_likes = patterns.get('average_likes', 0)
        avg_comments = patterns.get('average_comments', 0)
        posting_frequency = len(posts)
        
        # Analyze content themes
        top_hashtags = elements.get('top_hashtags', [])[:10]
        
        return {
            "success": True,
            "handle": competitor_handle,
            "metrics": {
                "followers": profile.get('followers', 0),
                "following": profile.get('following', 0),
                "posts_count": profile.get('posts_count', 0),
                "engagement_rate": avg_engagement,
                "avg_likes": avg_likes,
                "avg_comments": avg_comments,
                "posting_frequency": posting_frequency
            },
            "content_strategy": {
                "top_hashtags": top_hashtags,
                "best_posting_hours": patterns.get('best_posting_hours', []),
                "best_posting_days": patterns.get('best_posting_days', [])
            },
            "recent_posts": posts[:5]
        }
    
    def compare_with_competitors(self, brand_data, competitor_handles):
        """
        Compare brand with multiple competitors
        """
        competitors_data = []
        
        # Analyze each competitor
        for handle in competitor_handles:
            comp_data = self.analyze_competitor(handle)
            if comp_data.get('success'):
                competitors_data.append(comp_data)
        
        if not competitors_data:
            return {"success": False, "error": "No competitor data available"}
        
        # Prepare comparison data for AI analysis
        brand_profile = brand_data.get('profile', {})
        brand_patterns = brand_data.get('patterns', {})
        
        comparison_prompt = f"""
Analyze this brand vs competitors and provide strategic insights:

OUR BRAND:
- Followers: {brand_profile.get('followers', 0):,}
- Engagement Rate: {brand_patterns.get('average_engagement_rate', 0):.2f}%
- Posting Frequency: {brand_patterns.get('posting_frequency', 0)} posts analyzed

COMPETITORS:
{self._format_competitors_for_prompt(competitors_data)}

Provide analysis in JSON format:
{{
  "position": "market position (leader/challenger/follower)",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "opportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "threats": ["threat1", "threat2", "threat3"],
  "recommendations": [
    {{
      "area": "content/engagement/posting",
      "insight": "detailed insight",
      "action": "specific action to take"
    }}
  ],
  "competitive_gaps": ["gap1", "gap2"],
  "winning_strategies": ["strategy1", "strategy2"]
}}

Return ONLY valid JSON, no markdown.
"""
        
        try:
            result = self._generate_content(comparison_prompt)
            analysis = self._parse_json_response(result)
            
            return {
                "success": True,
                "brand_metrics": {
                    "followers": brand_profile.get('followers', 0),
                    "engagement_rate": brand_patterns.get('average_engagement_rate', 0),
                    "posting_frequency": brand_patterns.get('posting_frequency', 0)
                },
                "competitors": competitors_data,
                "analysis": analysis
            }
        except Exception as e:
            print(f"Error in competitor analysis: {e}")
            return {
                "success": True,
                "brand_metrics": {
                    "followers": brand_profile.get('followers', 0),
                    "engagement_rate": brand_patterns.get('average_engagement_rate', 0)
                },
                "competitors": competitors_data,
                "analysis": {
                    "position": "analysis pending",
                    "error": str(e)
                }
            }
    
    def _format_competitors_for_prompt(self, competitors_data):
        """Format competitor data for AI prompt"""
        formatted = []
        for comp in competitors_data:
            metrics = comp.get('metrics', {})
            formatted.append(f"""
- @{comp['handle']}:
  Followers: {metrics.get('followers', 0):,}
  Engagement: {metrics.get('engagement_rate', 0):.2f}%
  Posts Analyzed: {metrics.get('posting_frequency', 0)}
  Top Hashtags: {', '.join(comp.get('content_strategy', {}).get('top_hashtags', [])[:5])}
""")
        return '\n'.join(formatted)
    
    def identify_trending_content(self, competitor_handles):
        """
        Identify trending content types across competitors
        """
        all_posts = []
        
        for handle in competitor_handles:
            comp_data = self.analyze_competitor(handle, max_posts=10)
            if comp_data.get('success'):
                all_posts.extend(comp_data.get('recent_posts', []))
        
        if not all_posts:
            return {"success": False, "error": "No posts to analyze"}
        
        # Sort by engagement
        sorted_posts = sorted(all_posts, key=lambda x: x.get('engagement_rate', 0), reverse=True)
        top_posts = sorted_posts[:10]
        
        # Extract captions for analysis
        captions = [p.get('caption', '')[:200] for p in top_posts if p.get('caption')]
        
        trending_prompt = f"""
Analyze these top-performing posts from competitors and identify trends:

TOP PERFORMING CAPTIONS:
{chr(10).join([f"{i+1}. {cap}" for i, cap in enumerate(captions[:5])])}

ENGAGEMENT RATES: {', '.join([f"{p.get('engagement_rate', 0):.2f}%" for p in top_posts[:5]])}

Identify in JSON format:
{{
  "trending_topics": ["topic1", "topic2", "topic3"],
  "content_formats": ["format1", "format2"],
  "engagement_tactics": ["tactic1", "tactic2"],
  "tone_and_style": "description of successful tone",
  "actionable_insights": ["insight1", "insight2", "insight3"]
}}

Return ONLY valid JSON, no markdown.
"""
        
        try:
            result = self._generate_content(trending_prompt)
            trends = self._parse_json_response(result)
            
            return {
                "success": True,
                "top_posts": top_posts[:5],
                "trends": trends
            }
        except Exception as e:
            return {"success": False, "error": str(e)}


# Test
if __name__ == "__main__":
    analyzer = CompetitorAnalyzer()
    
    # Test single competitor
    print("Analyzing competitor...")
    result = analyzer.analyze_competitor("nike", max_posts=10)
    print(json.dumps(result, indent=2))