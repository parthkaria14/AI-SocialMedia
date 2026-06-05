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
from scrapers.apify_scraper import ApifyScraper

from agents.base_agent import BaseAgent

load_dotenv()

class CompetitorAnalyzer(BaseAgent):
    
    name = "competitor_analyzer"
    description = "Analyzes competitors via Instagram scraping, performs SWOT analysis, identifies trending content, and provides strategic recommendations."
    capabilities = [
        "analyze_competitor",
        "compare_with_competitors",
        "identify_trending_content",
        "swot_analysis"
    ]
    
    def __init__(self):
        super().__init__()
        self.scraper = InstagramScraper()
    
    # ─── Orchestrator Interface ────────────────────────────────────
    
    def execute(self, task: str, shared_memory) -> dict:
        """
        Called by the orchestrator. Routes to the appropriate method
        based on the task, reads context from shared memory.
        """
        step = shared_memory.start_step(self.name, task)
        
        try:
            task_lower = task.lower()
            
            if "trend" in task_lower:
                return self._execute_trending(task, shared_memory, step)
            elif "compar" in task_lower or "swot" in task_lower or "analyz" in task_lower:
                return self._execute_compare(task, shared_memory, step)
            else:
                return self._execute_compare(task, shared_memory, step)
        except Exception as e:
            step.complete(success=False, error=str(e))
            return {"success": False, "error": str(e)}
    
    def _execute_compare(self, task, shared_memory, step):
        """Compare brand with competitors using shared context."""
        scraped_data = shared_memory.read("scraped_data", {})
        step.input_summary = f"Comparing brand with competitors using scraped data"
        
        if not scraped_data:
            step.complete(success=False, error="No scraped data available")
            return {"success": False, "error": "No scraped data in shared memory"}
        
        # Get competitor handles from task context or use defaults
        competitor_handles = shared_memory.read("competitor_handles", [])
        
        if not competitor_handles:
            step.complete(success=False, error="No competitor handles specified")
            return {"success": False, "error": "No competitor_handles in shared memory"}
        
        comparison = self.compare_with_competitors(scraped_data, competitor_handles)
        
        # Write insights to shared memory
        shared_memory.write(self.name, "competitor_insights", comparison)
        
        # Send strategic insights to campaign agent
        if comparison.get("success"):
            analysis = comparison.get("analysis", {})
            shared_memory.send_message(
                self.name, "campaign_agent",
                "Competitor analysis complete. SWOT analysis and competitive gaps identified.",
                {
                    "position": analysis.get("position", "unknown"),
                    "opportunities": analysis.get("opportunities", []),
                    "competitive_gaps": analysis.get("competitive_gaps", [])
                }
            )
            
            # Also inform brand analyzer about content strategies
            shared_memory.send_message(
                self.name, "brand_analyzer",
                "Competitor content strategies analyzed. Winning strategies identified for content differentiation.",
                {
                    "winning_strategies": analysis.get("winning_strategies", []),
                    "strengths": analysis.get("strengths", [])
                }
            )
        
        step.complete(
            success=comparison.get("success", False),
            output_summary=f"Compared with {len(competitor_handles)} competitors. "
                          f"Position: {comparison.get('analysis', {}).get('position', 'unknown')}"
        )
        
        return {"success": True, "data": comparison}
    
    def _execute_trending(self, task, shared_memory, step):
        """Identify trending content from competitors."""
        competitor_handles = shared_memory.read("competitor_handles", [])
        step.input_summary = f"Identifying trending content from {len(competitor_handles)} competitors"
        
        if not competitor_handles:
            step.complete(success=False, error="No competitor handles specified")
            return {"success": False, "error": "No competitor_handles in shared memory"}
        
        trends = self.identify_trending_content(competitor_handles)
        
        # Write trends to shared memory
        shared_memory.write(self.name, "competitor_insights", {
            "trending": trends
        }, merge=True)
        
        # Notify brand analyzer about trends for content inspiration
        if trends.get("success"):
            shared_memory.send_message(
                self.name, "brand_analyzer",
                "Trending content identified from competitors. Use these trends to inform content generation.",
                {"trends": trends.get("trends", {})}
            )
        
        step.complete(
            success=trends.get("success", False),
            output_summary=f"Identified trends: {', '.join(trends.get('trends', {}).get('trending_topics', [])[:3])}"
        )
        
        return {"success": True, "data": trends}
    
    # ─── Original Methods (unchanged) ─────────────────────────────
    
    def analyze_competitor(self, competitor_handle, max_posts=20):
        """
        Analyze a single competitor's social media presence
        """
        # Try Apify first
        competitor_data = None
        try:
            print(f"[competitor_analyzer] Trying Apify for @{competitor_handle}...")
            apify = ApifyScraper()
            competitor_data = apify.get_complete_brand_data(competitor_handle, max_posts=max_posts)
            if competitor_data:
                print(f"[competitor_analyzer] ✅ Apify succeeded for @{competitor_handle}")
        except Exception as e:
            print(f"[competitor_analyzer] ⚠️ Apify failed for @{competitor_handle}: {e}")
        
        # Fallback to InstagramScraper (instaloader) if Apify failed or returned None
        if not competitor_data:
            try:
                print(f"[competitor_analyzer] Trying fallback instaloader for @{competitor_handle}...")
                competitor_data = self.scraper.get_complete_brand_data(competitor_handle, max_posts=max_posts)
                if competitor_data:
                    print(f"[competitor_analyzer] ✅ instaloader succeeded for @{competitor_handle}")
            except Exception as e:
                print(f"[competitor_analyzer] ❌ instaloader also failed for @{competitor_handle}: {e}")

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