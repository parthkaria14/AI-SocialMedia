"""
Orchestrator Agent - Coordinates all specialist agents for complex multi-agent tasks.

Two modes:
1. Predefined Pipelines  - Known workflows (brand_onboarding, content_creation, etc.)
2. Dynamic Planning      - LLM-based task decomposition for flexible tasks
"""

import json
from datetime import datetime

from agents.base_agent import BaseAgent
from agents.shared_memory import SharedMemory
from agents.brand_analyzer import BrandAnalyzer
from agents.campaign_agent import CampaignAgent
from agents.competitor_analyzer import CompetitorAnalyzer
from generators.image_generator import ImageGenerator
from scrapers.instagram_scraper import InstagramScraper


# ─── Pipeline Definitions ─────────────────────────────────────────

PIPELINES = {
    "brand_onboarding": {
        "name": "Brand Onboarding",
        "description": "Scrape Instagram data and analyze brand identity",
        "steps": [
            {"agent": "scraper", "task": "Scrape Instagram profile and posts"},
            {"agent": "brand_analyzer", "task": "Analyze brand profile from scraped data"},
        ]
    },
    "content_creation": {
        "name": "Content Creation Pipeline",
        "description": "Generate content ideas, captions, and images based on brand profile",
        "steps": [
            {"agent": "brand_analyzer", "task": "Generate content ideas based on brand context"},
            {"agent": "brand_analyzer", "task": "Generate captions for content drafts"},
            {"agent": "image_generator", "task": "Generate images for content ideas"},
        ]
    },
    "campaign_planning": {
        "name": "Campaign Planning",
        "description": "Analyze brand + competitors, then generate campaign strategy",
        "steps": [
            {"agent": "brand_analyzer", "task": "Analyze brand profile from scraped data"},
            {"agent": "competitor_analyzer", "task": "Compare brand with competitors and perform SWOT analysis"},
            {"agent": "campaign_agent", "task": "Generate campaign strategy based on brand and competitor analysis"},
        ]
    },
    "competitive_strategy": {
        "name": "Competitive Strategy",
        "description": "Full competitive analysis → ad recommendations → content aligned with strategy",
        "steps": [
            {"agent": "competitor_analyzer", "task": "Compare brand with competitors and perform SWOT analysis"},
            {"agent": "campaign_agent", "task": "Recommend ad platforms based on competitive landscape"},
            {"agent": "campaign_agent", "task": "Generate campaign strategy informed by competitor analysis"},
            {"agent": "brand_analyzer", "task": "Generate content ideas aligned with campaign strategy"},
        ]
    },
    "full_workflow": {
        "name": "Full Multi-Agent Workflow",
        "description": "Complete pipeline: scrape → analyze → competitor analysis → strategy → content → images",
        "steps": [
            {"agent": "scraper", "task": "Scrape Instagram profile and posts"},
            {"agent": "brand_analyzer", "task": "Analyze brand profile from scraped data"},
            {"agent": "competitor_analyzer", "task": "Compare brand with competitors and perform SWOT analysis"},
            {"agent": "campaign_agent", "task": "Generate campaign strategy based on brand and competitor analysis"},
            {"agent": "brand_analyzer", "task": "Generate content ideas aligned with campaign strategy"},
            {"agent": "brand_analyzer", "task": "Generate captions for content drafts"},
            {"agent": "image_generator", "task": "Generate images for content ideas"},
        ]
    }
}


class OrchestratorAgent(BaseAgent):
    """
    Central coordinator for multi-agent workflows.
    
    Manages agent execution order, passes context via SharedMemory,
    and produces a full execution trace showing agent collaboration.
    """
    
    name = "orchestrator"
    description = "Coordinates specialist agents to complete complex multi-agent tasks through predefined pipelines or dynamic LLM-based planning."
    capabilities = [
        "execute_pipeline",
        "execute_dynamic",
        "plan_task",
        "list_pipelines"
    ]
    
    def __init__(self):
        super().__init__()
        
        # Initialize all specialist agents
        self.agents = {
            "brand_analyzer": BrandAnalyzer(),
            "campaign_agent": CampaignAgent(),
            "competitor_analyzer": CompetitorAnalyzer(),
        }
        
        # Non-BaseAgent tools
        self.image_generator = ImageGenerator()
        self.scraper = InstagramScraper()
    
    def execute(self, task: str, shared_memory) -> dict:
        """Orchestrator's own execute - delegates to dynamic planning."""
        return self.execute_dynamic(task, shared_memory)
    
    # ─── Pipeline Execution ────────────────────────────────────────
    
    def list_pipelines(self) -> dict:
        """List all available predefined pipelines."""
        return {
            name: {
                "name": p["name"],
                "description": p["description"],
                "steps": len(p["steps"]),
                "agents_involved": list(set(s["agent"] for s in p["steps"]))
            }
            for name, p in PIPELINES.items()
        }
    
    def execute_pipeline(self, pipeline_name: str, context: dict) -> dict:
        """
        Execute a predefined multi-agent pipeline.
        
        Args:
            pipeline_name: Name of the pipeline (e.g., "content_creation")
            context: Initial context dict with keys like:
                - instagram_handle: str
                - brand_profile: dict (if already analyzed)
                - competitor_handles: list[str]
                - brand_id: int
        
        Returns:
            Full execution result with agent outputs, messages, and trace
        """
        if pipeline_name not in PIPELINES:
            return {
                "success": False,
                "error": f"Unknown pipeline: {pipeline_name}. Available: {list(PIPELINES.keys())}"
            }
        
        pipeline = PIPELINES[pipeline_name]
        
        # Create shared memory for this session
        memory = SharedMemory(task_description=f"Pipeline: {pipeline['name']}")
        
        # Seed shared memory with initial context
        self._seed_memory(memory, context)
        
        # Log orchestrator start
        orchestrator_step = memory.start_step(
            self.name, 
            f"Executing pipeline: {pipeline['name']}",
            input_summary=f"Context keys: {list(context.keys())}"
        )
        
        print(f"\n{'='*60}")
        print(f"🎯 ORCHESTRATOR: Starting pipeline '{pipeline['name']}'")
        print(f"   Session: {memory.session_id}")
        print(f"   Steps: {len(pipeline['steps'])}")
        print(f"{'='*60}")
        
        results = []
        all_success = True
        
        # Execute each step in sequence
        for i, step_def in enumerate(pipeline["steps"]):
            agent_name = step_def["agent"]
            task = step_def["task"]
            
            print(f"\n[Step {i+1}/{len(pipeline['steps'])}] {agent_name}: {task}")
            
            try:
                result = self._execute_step(agent_name, task, memory, context)
                results.append({
                    "step": i + 1,
                    "agent": agent_name,
                    "task": task,
                    "success": result.get("success", False),
                    "summary": result.get("data", {}) if isinstance(result.get("data"), str) else "Completed"
                })
                
                if not result.get("success", False):
                    print(f"   ⚠️ Step failed: {result.get('error', 'Unknown error')}")
                    all_success = False
                else:
                    print(f"   ✅ Step completed successfully")
                    
            except Exception as e:
                print(f"   ❌ Step error: {e}")
                results.append({
                    "step": i + 1,
                    "agent": agent_name,
                    "task": task,
                    "success": False,
                    "error": str(e)
                })
                all_success = False
        
        # Complete orchestrator step
        orchestrator_step.complete(
            success=all_success,
            output_summary=f"Pipeline completed: {sum(1 for r in results if r.get('success'))}/{len(results)} steps succeeded"
        )
        
        print(f"\n{'='*60}")
        print(f"{'✅' if all_success else '⚠️'} Pipeline '{pipeline['name']}' completed")
        print(f"   Success: {sum(1 for r in results if r.get('success'))}/{len(results)} steps")
        print(f"   Messages exchanged: {len(memory.get_all_messages())}")
        print(f"{'='*60}\n")
        
        return {
            "success": all_success,
            "session_id": memory.session_id,
            "pipeline": pipeline_name,
            "pipeline_name": pipeline["name"],
            "steps_completed": results,
            "agent_outputs": memory.read_all(),
            "agent_messages": memory.get_all_messages(),
            "execution_trace": memory.get_execution_trace(),
            "contributors": memory.get_contributors()
        }
    
    # ─── Dynamic Task Execution ────────────────────────────────────
    
    def execute_dynamic(self, task: str, context: dict = None) -> dict:
        """
        Use LLM to dynamically plan which agents to invoke for a given task.
        
        Args:
            task: Natural language description of what to accomplish
            context: Initial context dict
            
        Returns:
            Full execution result
        """
        context = context or {}
        
        # Create shared memory
        memory = SharedMemory(task_description=f"Dynamic: {task}")
        self._seed_memory(memory, context)
        
        # Step 1: Plan the execution
        plan = self._plan_task(task, context)
        
        if not plan.get("steps"):
            return {"success": False, "error": "Failed to create execution plan", "plan": plan}
        
        # Log orchestrator start
        orchestrator_step = memory.start_step(
            self.name,
            f"Dynamic execution: {task}",
            input_summary=f"Planned {len(plan['steps'])} steps"
        )
        
        print(f"\n{'='*60}")
        print(f"🧠 ORCHESTRATOR: Dynamic task planning")
        print(f"   Task: {task}")
        print(f"   Planned steps: {len(plan['steps'])}")
        for i, s in enumerate(plan["steps"]):
            print(f"   {i+1}. [{s['agent']}] {s['task']}")
        print(f"{'='*60}")
        
        results = []
        all_success = True
        
        # Step 2: Execute planned steps
        for i, step_def in enumerate(plan["steps"]):
            agent_name = step_def["agent"]
            step_task = step_def["task"]
            
            print(f"\n[Step {i+1}/{len(plan['steps'])}] {agent_name}: {step_task}")
            
            try:
                result = self._execute_step(agent_name, step_task, memory, context)
                results.append({
                    "step": i + 1,
                    "agent": agent_name,
                    "task": step_task,
                    "success": result.get("success", False)
                })
                
                if not result.get("success", False):
                    print(f"   ⚠️ Step failed: {result.get('error', 'Unknown error')}")
                    all_success = False
                else:
                    print(f"   ✅ Step completed")
                    
            except Exception as e:
                print(f"   ❌ Step error: {e}")
                results.append({
                    "step": i + 1,
                    "agent": agent_name,
                    "task": step_task,
                    "success": False,
                    "error": str(e)
                })
                all_success = False
        
        orchestrator_step.complete(
            success=all_success,
            output_summary=f"Dynamic task completed: {sum(1 for r in results if r.get('success'))}/{len(results)} steps"
        )
        
        return {
            "success": all_success,
            "session_id": memory.session_id,
            "task": task,
            "plan": plan,
            "steps_completed": results,
            "agent_outputs": memory.read_all(),
            "agent_messages": memory.get_all_messages(),
            "execution_trace": memory.get_execution_trace(),
            "contributors": memory.get_contributors()
        }
    
    def _plan_task(self, task: str, context: dict) -> dict:
        """Use LLM to decompose a task into agent steps."""
        available_agents = {
            name: agent.get_agent_info()
            for name, agent in self.agents.items()
        }
        # Add non-BaseAgent tools
        available_agents["scraper"] = {
            "name": "scraper",
            "description": "Scrapes Instagram profiles and posts to collect social media data",
            "capabilities": ["scrape_profile", "scrape_posts", "get_complete_brand_data"]
        }
        available_agents["image_generator"] = {
            "name": "image_generator",
            "description": "Generates AI images using Pollinations.ai based on text prompts",
            "capabilities": ["generate_image", "batch_generate"]
        }
        
        prompt = f"""
You are an AI orchestrator planning which specialist agents to invoke for a task.

TASK: {task}

AVAILABLE CONTEXT:
{json.dumps({k: type(v).__name__ if not isinstance(v, (str, int, float, bool, list)) else v for k, v in context.items()}, indent=2)}

AVAILABLE AGENTS:
{json.dumps(available_agents, indent=2)}

Plan the execution steps. Each step should use one agent.
Consider dependencies: an agent may need data from a previous agent.

Return as JSON:
{{
  "reasoning": "explanation of why this plan makes sense",
  "steps": [
    {{
      "agent": "agent_name (must be one of the available agents)",
      "task": "specific task description for this agent",
      "depends_on": "what data from previous steps this needs"
    }}
  ]
}}

Rules:
- Use only agent names from the available agents list
- Order steps so dependencies are satisfied
- Include 2-5 steps (don't over-complicate)
- Each step should be a single, focused task

Return ONLY valid JSON, no markdown.
"""
        
        try:
            result = self._generate_content(prompt)
            plan = self._parse_json_response(result)
            
            # Validate agent names
            valid_agents = set(available_agents.keys())
            validated_steps = []
            for step in plan.get("steps", []):
                if step.get("agent") in valid_agents:
                    validated_steps.append(step)
                else:
                    print(f"   ⚠️ Skipping unknown agent: {step.get('agent')}")
            
            plan["steps"] = validated_steps
            return plan
            
        except Exception as e:
            print(f"Error planning task: {e}")
            return {"reasoning": f"Planning failed: {e}", "steps": []}
    
    # ─── Internal Helpers ──────────────────────────────────────────
    
    def _seed_memory(self, memory: SharedMemory, context: dict):
        """Seed shared memory with initial context."""
        if context.get("brand_profile"):
            memory.write(self.name, "brand_context", context["brand_profile"])
        
        if context.get("scraped_data"):
            memory.write(self.name, "scraped_data", context["scraped_data"])
        
        if context.get("competitor_handles"):
            memory.write(self.name, "competitor_handles", context["competitor_handles"])
        
        if context.get("campaign_data"):
            memory.write(self.name, "campaign_context", {"campaign_data": context["campaign_data"]})
        
        if context.get("analytics_data"):
            memory.write(self.name, "analytics_data", context["analytics_data"])
    
    def _execute_step(self, agent_name: str, task: str, memory: SharedMemory, context: dict) -> dict:
        """Execute a single step by delegating to the appropriate agent."""
        
        if agent_name == "scraper":
            return self._run_scraper(task, memory, context)
        elif agent_name == "image_generator":
            return self._run_image_generator(task, memory, context)
        elif agent_name in self.agents:
            agent = self.agents[agent_name]
            return agent.execute(task, memory)
        else:
            return {"success": False, "error": f"Unknown agent: {agent_name}"}
    
    def _run_scraper(self, task: str, memory: SharedMemory, context: dict) -> dict:
        """Run the Instagram scraper and write results to shared memory."""
        step = memory.start_step("scraper", task)
        
        instagram_handle = context.get("instagram_handle", "")
        if not instagram_handle:
            step.complete(success=False, error="No instagram_handle in context")
            return {"success": False, "error": "No instagram_handle provided"}
        
        step.input_summary = f"Scraping @{instagram_handle}"
        
        try:
            brand_data = self.scraper.get_complete_brand_data(instagram_handle, max_posts=30)
            
            if not brand_data:
                step.complete(success=False, error="Scraping returned no data")
                return {"success": False, "error": "Failed to scrape data"}
            
            # Write to shared memory
            memory.write("scraper", "scraped_data", brand_data)
            
            profile = brand_data.get("profile", {})
            posts_count = len(brand_data.get("posts", []))
            
            step.complete(
                success=True,
                output_summary=f"Scraped @{instagram_handle}: {profile.get('followers', 0)} followers, {posts_count} posts"
            )
            
            return {"success": True, "data": {"posts_scraped": posts_count, "handle": instagram_handle}}
            
        except Exception as e:
            step.complete(success=False, error=str(e))
            return {"success": False, "error": str(e)}
    
    def _run_image_generator(self, task: str, memory: SharedMemory, context: dict) -> dict:
        """Run image generation for content drafts in shared memory."""
        step = memory.start_step("image_generator", task)
        
        content_drafts = memory.read("content_drafts", [])
        brand_context = memory.read("brand_context", {})
        
        if not content_drafts:
            step.complete(success=False, error="No content drafts to generate images for")
            return {"success": False, "error": "No content_drafts in shared memory"}
        
        step.input_summary = f"Generating images for {len(content_drafts)} content ideas"
        
        try:
            results = self.image_generator.batch_generate(
                content_drafts[:3],  # Limit to 3 to avoid timeouts
                brand_context,
                count=min(3, len(content_drafts))
            )
            
            # Write to shared memory
            memory.write("image_generator", "image_results", results)
            
            successful = sum(1 for r in results if r.get("success"))
            
            step.complete(
                success=True,
                output_summary=f"Generated {successful}/{len(results)} images"
            )
            
            return {"success": True, "data": {"images_generated": successful}}
            
        except Exception as e:
            step.complete(success=False, error=str(e))
            return {"success": False, "error": str(e)}
