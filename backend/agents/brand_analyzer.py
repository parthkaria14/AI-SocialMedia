import google.generativeai as genai
from groq import Groq
import os
import json
from dotenv import load_dotenv

from agents.base_agent import BaseAgent

load_dotenv()

class BrandAnalyzer(BaseAgent):
    
    name = "brand_analyzer"
    description = "Analyzes brand identity from social media data and generates content ideas, captions, and performance insights."
    capabilities = [
        "analyze_brand_profile",
        "generate_content_ideas",
        "generate_caption",
        "analyze_performance"
    ]
    
    def __init__(self):
        super().__init__()
    
    # ─── Orchestrator Interface ────────────────────────────────────
    
    def execute(self, task: str, shared_memory) -> dict:
        """
        Called by the orchestrator. Routes to the appropriate method
        based on the task, reads context from shared memory, and
        writes results back.
        """
        step = shared_memory.start_step(self.name, task)
        
        try:
            task_lower = task.lower()
            
            if "analyze" in task_lower and "brand" in task_lower:
                return self._execute_analyze_brand(task, shared_memory, step)
            elif "content" in task_lower and ("idea" in task_lower or "generate" in task_lower):
                return self._execute_generate_content(task, shared_memory, step)
            elif "caption" in task_lower:
                return self._execute_generate_caption(task, shared_memory, step)
            elif "performance" in task_lower:
                return self._execute_analyze_performance(task, shared_memory, step)
            else:
                # Default: try to analyze brand
                return self._execute_analyze_brand(task, shared_memory, step)
        except Exception as e:
            step.complete(success=False, error=str(e))
            return {"success": False, "error": str(e)}
    
    def _execute_analyze_brand(self, task, shared_memory, step):
        """Analyze brand profile using scraped data from shared memory."""
        # Read scraped data from shared memory (written by scraper)
        scraped_data = shared_memory.read("scraped_data", {})
        step.input_summary = f"Analyzing brand from scraped data with {len(scraped_data.get('posts', []))} posts"
        
        if not scraped_data:
            step.complete(success=False, error="No scraped data available in shared memory")
            return {"success": False, "error": "No scraped data in shared memory"}
        
        # Perform analysis
        brand_profile = self.analyze_brand_profile(scraped_data)
        
        # Write results to shared memory
        shared_memory.write(self.name, "brand_context", brand_profile, merge=True)
        
        # Check for competitor insights and enrich if available
        competitor_insights = shared_memory.read("competitor_insights", {})
        if competitor_insights:
            # Send message to note that competitor data was used
            shared_memory.send_message(
                self.name, "campaign_agent",
                "Brand analysis complete. Competitor insights were available and may inform content strategy.",
                {"brand_voice": brand_profile.get("brand_voice"), "has_competitor_data": True}
            )
        
        step.complete(
            success=True,
            output_summary=f"Brand profile analyzed: voice={brand_profile.get('brand_voice', 'unknown')}, "
                          f"themes={len(brand_profile.get('content_themes', []))} themes identified"
        )
        
        return {"success": True, "data": brand_profile}
    
    def _execute_generate_content(self, task, shared_memory, step):
        """Generate content ideas using brand context from shared memory."""
        brand_context = shared_memory.read("brand_context", {})
        step.input_summary = f"Generating content with brand voice: {brand_context.get('brand_voice', 'unknown')}"
        
        if not brand_context:
            step.complete(success=False, error="No brand context available")
            return {"success": False, "error": "No brand context in shared memory"}
        
        # Check for messages from other agents (e.g., competitor insights)
        messages = shared_memory.get_messages_for(self.name)
        
        # Enrich context using competitor insights if available
        competitor_insights = shared_memory.read("competitor_insights", {})
        platform = "instagram"  # Default
        count = 5
        
        # If competitor data is available, use trending topics to inform ideas
        enriched_profile = dict(brand_context)
        if competitor_insights:
            analysis = competitor_insights.get("analysis", {})
            gaps = analysis.get("competitive_gaps", [])
            if gaps:
                enriched_profile["competitive_gaps_to_address"] = gaps
            
            # Notify campaign agent about content generation
            shared_memory.send_message(
                self.name, "campaign_agent",
                "Content ideas generated with competitor gap analysis incorporated.",
                {"used_competitor_data": True, "gaps_addressed": gaps}
            )
        
        content_ideas = self.generate_content_ideas(enriched_profile, platform=platform, count=count)
        
        # Write to shared memory
        shared_memory.write(self.name, "content_drafts", content_ideas)
        
        step.complete(
            success=True,
            output_summary=f"Generated {len(content_ideas)} content ideas for {platform}"
        )
        
        return {"success": True, "data": content_ideas}
    
    def _execute_generate_caption(self, task, shared_memory, step):
        """Generate captions for content drafts in shared memory."""
        brand_context = shared_memory.read("brand_context", {})
        content_drafts = shared_memory.read("content_drafts", [])
        step.input_summary = f"Generating captions for {len(content_drafts)} content drafts"
        
        if not brand_context or not content_drafts:
            step.complete(success=False, error="Missing brand context or content drafts")
            return {"success": False, "error": "Need brand_context and content_drafts in shared memory"}
        
        captions = []
        for idea in content_drafts[:5]:
            caption_data = self.generate_caption(brand_context, idea, platform="instagram")
            captions.append(caption_data)
        
        # Write captions back - update content drafts with captions
        enriched_drafts = []
        for i, idea in enumerate(content_drafts[:5]):
            enriched = dict(idea)
            if i < len(captions):
                enriched["generated_caption"] = captions[i]
            enriched_drafts.append(enriched)
        
        shared_memory.write(self.name, "content_drafts", enriched_drafts)
        
        step.complete(
            success=True,
            output_summary=f"Generated {len(captions)} captions for content ideas"
        )
        
        return {"success": True, "data": captions}
    
    def _execute_analyze_performance(self, task, shared_memory, step):
        """Analyze performance and write recommendations."""
        # This would typically read analytics data from shared memory
        analytics_data = shared_memory.read("analytics_data", [])
        step.input_summary = f"Analyzing performance of {len(analytics_data)} data points"
        
        if not analytics_data:
            step.complete(success=False, error="No analytics data available")
            return {"success": False, "error": "No analytics data in shared memory"}
        
        analysis = self.analyze_performance(analytics_data)
        
        shared_memory.write(self.name, "performance_analysis", analysis)
        
        # Send recommendations to campaign agent
        if analysis.get("recommendations"):
            shared_memory.send_message(
                self.name, "campaign_agent",
                "Performance analysis complete. Recommendations available for campaign optimization.",
                {"recommendations": analysis["recommendations"]}
            )
        
        step.complete(
            success=True,
            output_summary=f"Performance analyzed: {len(analysis.get('recommendations', []))} recommendations"
        )
        
        return {"success": True, "data": analysis}
    
    # ─── Original Methods (unchanged) ─────────────────────────────
    
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
        # Include competitive gaps if available
        competitive_gaps = brand_profile.get('competitive_gaps_to_address', [])
        gaps_section = ""
        if competitive_gaps:
            gaps_section = f"\nCOMPETITIVE GAPS TO ADDRESS:\n{chr(10).join(['- ' + g for g in competitive_gaps])}\n"
        
        prompt = f"""
Based on this brand profile, generate {count} creative content ideas for {platform}:

BRAND VOICE: {brand_profile.get('brand_voice')}
TARGET AUDIENCE: {brand_profile.get('target_audience')}
CONTENT THEMES: {', '.join(brand_profile.get('content_themes', []))}
CONTENT PILLARS: {', '.join(brand_profile.get('content_pillars', []))}
{gaps_section}
Generate content ideas that:
- Align with the brand voice and themes
- Engage the target audience
- Are suitable for {platform}
- Include a mix of content types: image posts, carousel posts, reels/video content
- Are actionable and specific

Return as JSON array with format:
[
  {{
    "title": "content idea title",
    "description": "detailed visual description for image generation",
    "content_type": "image/carousel/video/reel",
    "caption_hook": "engaging opening line",
    "hashtag_suggestions": ["tag1", "tag2"]
  }}
]

Make sure descriptions are vivid and specific for AI image generation.
Example: "A vibrant summer scene with people enjoying outdoor activities, bright sunlight, colorful clothing, beach background, joyful expressions"

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
        Generate platform-optimized caption for a specific content piece
        """
        # Platform-specific guidelines
        platform_guidelines = {
            "instagram": {
                "max_length": 1500,
                "style": "Visual storytelling with emojis, 3-5 paragraphs, engaging hooks, call-to-action",
                "hashtags": "5-10 relevant hashtags",
                "format": "Hook + Story + CTA + Hashtags",
                "emojis": "Use emojis strategically for visual appeal"
            },
            "twitter": {
                "max_length": 280,
                "style": "Concise, punchy, conversational, trending topics",
                "hashtags": "1-3 hashtags maximum",
                "format": "Short impactful message + 1-2 hashtags",
                "emojis": "Use sparingly, focus on text impact"
            },
            "linkedin": {
                "max_length": 3000,
                "style": "Professional, thought leadership, industry insights, value-driven",
                "hashtags": "3-5 professional hashtags",
                "format": "Professional insight + Key takeaways + Industry hashtags",
                "emojis": "Minimal, professional use only but do add emojis for visual appeal"
            }
        }
        
        guidelines = platform_guidelines.get(platform.lower(), platform_guidelines["instagram"])
        
        prompt = f"""
Write a {platform.upper()}-optimized caption based on:

BRAND VOICE: {brand_profile.get('brand_voice')}
TARGET AUDIENCE: {brand_profile.get('target_audience')}
CONTENT IDEA: {content_idea.get('description')}
CONTENT TITLE: {content_idea.get('title')}

{platform.upper()} SPECIFIC REQUIREMENTS:
- Maximum Length: {guidelines['max_length']} characters
- Style: {guidelines['style']}
- Hashtag Strategy: {guidelines['hashtags']}
- Format: {guidelines['format']}
- Emoji Usage: {guidelines['emojis']}

PLATFORM-SPECIFIC GUIDELINES:
{"Instagram: Create visually engaging multi-paragraph story with strong hook, emotional connection, and clear CTA. Use line breaks for readability." if platform == "instagram" else ""}
{"Twitter: Be concise and impactful. Every word counts. Make it shareable and conversation-starting. Focus on one key message." if platform == "twitter" else ""}
{"LinkedIn: Position as thought leadership. Share professional insights, industry trends, or valuable lessons. Be authoritative yet approachable." if platform == "linkedin" else ""}

Return as JSON:
{{
  "caption": "platform-optimized caption text",
  "hashtags": ["tag1", "tag2"],
  "cta": "call to action",
  "character_count": count,
  "platform_notes": "why this works for {platform}"
}}

IMPORTANT: 
- For Twitter, keep TOTAL length (caption + hashtags) under 280 characters
- For Instagram, use 2200 character limit effectively
- For LinkedIn, focus on professional value and insights

Return ONLY valid JSON, no markdown.
"""
        
        try:
            result = self._generate_content(prompt)
            caption_data = self._parse_json_response(result)
            caption_data['platform'] = platform
            return caption_data
        except Exception as e:
            print(f"Error generating caption: {e}")
            return {
                "caption": content_idea.get('caption_hook', ''),
                "hashtags": content_idea.get('hashtag_suggestions', []),
                "cta": "Check it out!",
                "platform": platform
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