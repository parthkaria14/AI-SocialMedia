"""
Campaign Management & Ad Platform Recommendation Agent
"""

import google.generativeai as genai
import os
import json
from dotenv import load_dotenv

from agents.base_agent import BaseAgent

load_dotenv()

class CampaignAgent(BaseAgent):
    
    name = "campaign_agent"
    description = "Generates marketing strategies, analyzes campaign performance, recommends ad platforms, and allocates budgets."
    capabilities = [
        "recommend_ad_platforms",
        "analyze_campaign_performance",
        "generate_campaign_strategy",
        "calculate_campaign_metrics"
    ]
    
    def __init__(self):
        super().__init__()
    
    # ─── Orchestrator Interface ────────────────────────────────────
    
    def execute(self, task: str, shared_memory) -> dict:
        """
        Called by the orchestrator. Routes to the appropriate method
        based on the task, reads context from shared memory.
        """
        step = shared_memory.start_step(self.name, task)
        
        try:
            task_lower = task.lower()
            
            if "ad" in task_lower and ("recommend" in task_lower or "platform" in task_lower):
                return self._execute_ad_recommendations(task, shared_memory, step)
            elif "analyz" in task_lower and "campaign" in task_lower:
                return self._execute_analyze_campaign(task, shared_memory, step)
            elif "strategy" in task_lower or "plan" in task_lower:
                return self._execute_generate_strategy(task, shared_memory, step)
            else:
                # Default: generate strategy
                return self._execute_generate_strategy(task, shared_memory, step)
        except Exception as e:
            step.complete(success=False, error=str(e))
            return {"success": False, "error": str(e)}
    
    def _execute_ad_recommendations(self, task, shared_memory, step):
        """Generate ad platform recommendations using shared context."""
        brand_context = shared_memory.read("brand_context", {})
        step.input_summary = f"Generating ad recommendations for brand voice: {brand_context.get('brand_voice', 'unknown')}"
        
        if not brand_context:
            step.complete(success=False, error="No brand context available")
            return {"success": False, "error": "No brand context in shared memory"}
        
        # Check for messages from other agents
        messages = shared_memory.get_messages_for(self.name)
        
        # Use competitor insights to inform recommendations
        competitor_insights = shared_memory.read("competitor_insights", {})
        objectives = ["brand_awareness", "engagement"]
        if competitor_insights:
            analysis = competitor_insights.get("analysis", {})
            gaps = analysis.get("competitive_gaps", [])
            if gaps:
                objectives.append("competitive_differentiation")
        
        budget = 1000  # Default
        target_metrics = {"target_ctr": 2.0, "target_conversions": 50}
        
        recommendations = self.recommend_ad_platforms(
            brand_context, objectives, budget, target_metrics
        )
        
        # Write to shared memory
        shared_memory.write(self.name, "campaign_context", {
            "ad_recommendations": recommendations,
            "used_competitor_insights": bool(competitor_insights)
        }, merge=True)
        
        # Send message to brand analyzer about recommended platforms
        if recommendations.get("recommendations"):
            top_platform = recommendations["recommendations"][0].get("platform", "unknown")
            shared_memory.send_message(
                self.name, "brand_analyzer",
                f"Top recommended ad platform: {top_platform}. Content should be optimized for this platform.",
                {"top_platform": top_platform, "all_platforms": [r.get("platform") for r in recommendations.get("recommendations", [])]}
            )
        
        step.complete(
            success=True,
            output_summary=f"Generated {len(recommendations.get('recommendations', []))} ad platform recommendations"
        )
        
        return {"success": True, "data": recommendations}
    
    def _execute_analyze_campaign(self, task, shared_memory, step):
        """Analyze campaign performance using shared context."""
        campaign_context = shared_memory.read("campaign_context", {})
        step.input_summary = "Analyzing campaign performance"
        
        campaign_data = campaign_context.get("campaign_data", {})
        analytics_data = campaign_context.get("analytics_data", [])
        
        if not campaign_data:
            step.complete(success=False, error="No campaign data available")
            return {"success": False, "error": "No campaign data in shared memory"}
        
        analysis = self.analyze_campaign_performance(campaign_data, analytics_data)
        
        shared_memory.write(self.name, "campaign_context", {
            "performance_analysis": analysis
        }, merge=True)
        
        # Send insights to brand analyzer for content optimization
        if analysis.get("optimization_recommendations"):
            shared_memory.send_message(
                self.name, "brand_analyzer",
                "Campaign analysis complete. Content optimization recommendations available.",
                {"recommendations": analysis["optimization_recommendations"][:3]}
            )
        
        step.complete(
            success=True,
            output_summary=f"Campaign analyzed: {analysis.get('overall_performance', 'unknown')} performance"
        )
        
        return {"success": True, "data": analysis}
    
    def _execute_generate_strategy(self, task, shared_memory, step):
        """Generate campaign strategy using all available context."""
        brand_context = shared_memory.read("brand_context", {})
        competitor_insights = shared_memory.read("competitor_insights", {})
        step.input_summary = f"Generating strategy with brand context and {'competitor' if competitor_insights else 'no competitor'} insights"
        
        if not brand_context:
            step.complete(success=False, error="No brand context available")
            return {"success": False, "error": "No brand context in shared memory"}
        
        # Enrich brand profile with competitor data if available
        enriched_profile = dict(brand_context)
        if competitor_insights:
            analysis = competitor_insights.get("analysis", {})
            enriched_profile["competitive_landscape"] = {
                "position": analysis.get("position", "unknown"),
                "opportunities": analysis.get("opportunities", []),
                "threats": analysis.get("threats", [])
            }
        
        objectives = ["brand_awareness", "engagement", "content_quality"]
        budget = 1000
        duration_days = 30
        
        strategy = self.generate_campaign_strategy(
            enriched_profile, objectives, budget, duration_days
        )
        
        # Write to shared memory
        shared_memory.write(self.name, "campaign_context", {
            "strategy": strategy,
            "informed_by_competitors": bool(competitor_insights)
        }, merge=True)
        
        # Notify brand analyzer to generate content aligned with strategy
        if strategy.get("content_calendar"):
            shared_memory.send_message(
                self.name, "brand_analyzer",
                "Campaign strategy generated with content calendar. Align content generation with this calendar.",
                {"campaign_theme": strategy.get("campaign_theme"), "calendar_days": len(strategy.get("content_calendar", []))}
            )
        
        step.complete(
            success=True,
            output_summary=f"Strategy generated: {strategy.get('campaign_name', 'Untitled')} "
                          f"with {len(strategy.get('content_calendar', []))} calendar entries"
        )
        
        return {"success": True, "data": strategy}
    
    # ─── Original Methods (unchanged) ─────────────────────────────
    
    def recommend_ad_platforms(self, brand_profile, campaign_objectives, budget, target_metrics):
        """
        Recommend best ad platforms based on brand, objectives, and budget
        """
        prompt = f"""
You are an expert media buyer analyzing the best advertising platforms for a brand.

BRAND PROFILE:
- Industry: {brand_profile.get('content_themes', [])}
- Target Audience: {brand_profile.get('target_audience', '')}
- Brand Voice: {brand_profile.get('brand_voice', '')}

CAMPAIGN OBJECTIVES: {', '.join(campaign_objectives)}
TOTAL BUDGET: ${budget}
TARGET METRICS: {json.dumps(target_metrics)}

Analyze and recommend the TOP 3 advertising platforms from:
1. Google Ads (Search, Display, YouTube)
2. Meta Ads (Facebook, Instagram)
3. LinkedIn Ads
4. Twitter/X Ads
5. TikTok Ads
6. Email Marketing
7. Programmatic Display

For each platform, provide:

Return as JSON:
{{
  "recommendations": [
    {{
      "platform": "platform name",
      "confidence_score": 0-100,
      "recommended_budget": dollar amount,
      "expected_roi": percentage,
      "reasoning": {{
        "audience_fit": "why audience matches",
        "cost_efficiency": "cost analysis",
        "conversion_potential": "conversion likelihood",
        "best_for": ["objective1", "objective2"]
      }},
      "recommended_strategy": {{
        "ad_types": ["type1", "type2"],
        "targeting": {{"demographic": "details", "interests": ["interest1"]}},
        "bidding_strategy": "strategy name",
        "content_recommendations": ["recommendation1", "recommendation2"]
      }},
      "expected_metrics": {{
        "impressions": 10000,
        "clicks": 500,
        "conversions": 50,
        "ctr": 2.5,
        "cpc": 1.50,
        "roas": 3.0
      }},
      "pros": ["pro1", "pro2"],
      "cons": ["con1", "con2"]
    }}
  ],
  "budget_allocation": {{
    "platform1": 40,
    "platform2": 35,
    "platform3": 25
  }},
  "timeline_recommendation": "suggested campaign duration",
  "success_metrics": ["metric1", "metric2"],
  "optimization_tips": ["tip1", "tip2", "tip3"]
}}

Return ONLY valid JSON, no markdown.
"""
        
        try:
            result = self._generate_content(prompt)
            return self._parse_json_response(result)
        except Exception as e:
            print(f"Error in ad platform recommendation: {e}")
            return {
                "recommendations": [],
                "error": str(e)
            }
    
    def analyze_campaign_performance(self, campaign_data, analytics_data):
        """
        Analyze campaign performance and provide optimization recommendations
        """
        prompt = f"""
Analyze this marketing campaign performance:

CAMPAIGN: {campaign_data.get('name')}
TYPE: {campaign_data.get('campaign_type')}
PLATFORMS: {', '.join(campaign_data.get('platforms', []))}
BUDGET: ${campaign_data.get('budget', 0)}
SPENT: ${campaign_data.get('spent', 0)}

PERFORMANCE METRICS:
- Total Impressions: {campaign_data.get('total_impressions', 0):,}
- Total Clicks: {campaign_data.get('total_clicks', 0):,}
- Total Conversions: {campaign_data.get('total_conversions', 0):,}
- CTR: {(campaign_data.get('total_clicks', 0) / campaign_data.get('total_impressions', 1) * 100):.2f}%
- Conversion Rate: {(campaign_data.get('total_conversions', 0) / campaign_data.get('total_clicks', 1) * 100):.2f}%

DETAILED ANALYTICS:
{json.dumps(analytics_data[:5], indent=2)}

Provide comprehensive analysis:

Return as JSON:
{{
  "overall_performance": "excellent/good/average/poor",
  "performance_score": 0-100,
  "key_insights": [
    {{
      "insight": "key finding",
      "impact": "high/medium/low",
      "recommendation": "what to do"
    }}
  ],
  "what_is_working": ["item1", "item2"],
  "what_needs_improvement": ["item1", "item2"],
  "optimization_recommendations": [
    {{
      "area": "targeting/creative/bidding/budget",
      "current_issue": "description",
      "recommended_action": "specific action",
      "expected_impact": "impact description",
      "priority": "high/medium/low"
    }}
  ],
  "budget_recommendations": {{
    "current_efficiency": "analysis",
    "recommended_changes": ["change1", "change2"],
    "reallocation_suggestion": {{"platform1": "percentage"}}
  }},
  "predicted_outcomes": {{
    "if_optimized": {{
      "expected_ctr_improvement": "percentage",
      "expected_conversion_improvement": "percentage",
      "expected_roi_improvement": "percentage"
    }}
  }},
  "next_steps": ["step1", "step2", "step3"]
}}

Return ONLY valid JSON, no markdown.
"""
        
        try:
            result = self._generate_content(prompt)
            return self._parse_json_response(result)
        except Exception as e:
            print(f"Error analyzing campaign: {e}")
            return {"error": str(e)}
    
    def generate_campaign_strategy(self, brand_profile, objectives, budget, duration_days):
        """
        Generate complete campaign strategy
        """
        prompt = f"""
Create a comprehensive social media campaign strategy:

BRAND PROFILE:
{json.dumps(brand_profile, indent=2)}

CAMPAIGN OBJECTIVES: {', '.join(objectives)}
BUDGET: ${budget}
DURATION: {duration_days} days

Create a detailed campaign plan:

Return as JSON:
{{
  "campaign_name": "creative campaign name",
  "campaign_theme": "central theme",
  "content_calendar": [
    {{
      "day": 1,
      "platform": "platform",
      "content_type": "type",
      "content_idea": "specific idea",
      "optimal_time": "HH:MM",
      "expected_engagement": "high/medium/low"
    }}
  ],
  "platform_strategy": {{
    "instagram": {{
      "focus": "what to focus on",
      "posting_frequency": "X posts per week",
      "content_mix": {{"reels": "40%", "posts": "40%", "stories": "20%"}},
      "hashtag_strategy": ["strategy point"],
      "engagement_tactics": ["tactic1", "tactic2"]
    }},
    "facebook": {{}},
    "twitter": {{}},
    "linkedin": {{}}
  }},
  "creative_requirements": [
    {{
      "asset_type": "image/video",
      "specifications": "details",
      "quantity": 5,
      "purpose": "awareness/conversion"
    }}
  ],
  "kpi_targets": {{
    "impressions": 50000,
    "engagement_rate": "3.5%",
    "click_through_rate": "2.0%",
    "conversions": 100,
    "roi": "2.5x"
  }},
  "milestone_checkpoints": [
    {{"day": 7, "check": "what to check", "target": "target metric"}},
    {{"day": 14, "check": "what to check", "target": "target metric"}},
    {{"day": 30, "check": "what to check", "target": "target metric"}}
  ],
  "risk_mitigation": ["risk1 and mitigation", "risk2 and mitigation"],
  "success_criteria": ["criterion1", "criterion2"]
}}

Return ONLY valid JSON, no markdown.
"""
        
        try:
            result = self._generate_content(prompt)
            return self._parse_json_response(result)
        except Exception as e:
            print(f"Error generating campaign strategy: {e}")
            return {"error": str(e)}
    
    def calculate_campaign_metrics(self, analytics_data):
        """
        Calculate comprehensive campaign metrics
        """
        if not analytics_data:
            return {}
        
        total_impressions = sum(a.get('impressions', 0) for a in analytics_data)
        total_clicks = sum(a.get('clicks', 0) for a in analytics_data)
        total_conversions = sum(a.get('conversions', 0) for a in analytics_data)
        total_spend = sum(a.get('spend', 0) for a in analytics_data)
        total_engagement = sum(a.get('likes', 0) + a.get('comments', 0) + a.get('shares', 0) for a in analytics_data)
        
        ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        conversion_rate = (total_conversions / total_clicks * 100) if total_clicks > 0 else 0
        cpc = (total_spend / total_clicks) if total_clicks > 0 else 0
        cpm = (total_spend / total_impressions * 1000) if total_impressions > 0 else 0
        
        return {
            "total_impressions": total_impressions,
            "total_clicks": total_clicks,
            "total_conversions": total_conversions,
            "total_engagement": total_engagement,
            "total_spend": total_spend,
            "ctr": round(ctr, 2),
            "conversion_rate": round(conversion_rate, 2),
            "cpc": round(cpc, 2),
            "cpm": round(cpm, 2),
            "engagement_rate": round((total_engagement / total_impressions * 100), 2) if total_impressions > 0 else 0
        }