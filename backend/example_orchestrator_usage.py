"""
Example usage of the Orchestrator with all agents
"""

import json
from agents.orchestrator import OrchestratorAgent

def example_1_list_pipelines():
    """Example 1: List all available pipelines"""
    print("\n" + "="*60)
    print("EXAMPLE 1: List Available Pipelines")
    print("="*60)

    orchestrator = OrchestratorAgent()
    pipelines = orchestrator.list_pipelines()

    print(f"\nFound {len(pipelines)} available pipelines:\n")
    for name, info in pipelines.items():
        print(f"  {name}")
        print(f"    Name: {info['name']}")
        print(f"    Description: Pipeline with {info['steps']} steps")
        print(f"    Agents: {', '.join(info['agents_involved'])}")
        print()


def example_2_content_creation():
    """Example 2: Execute content creation pipeline"""
    print("\n" + "="*60)
    print("EXAMPLE 2: Content Creation Pipeline")
    print("="*60)

    orchestrator = OrchestratorAgent()

    # Context with brand profile already analyzed
    context = {
        "brand_profile": {
            "brand_voice": "professional",
            "target_audience": "tech professionals",
            "content_themes": ["productivity", "technology", "innovation"],
            "content_pillars": ["tips and tricks", "product updates", "industry insights"]
        }
    }

    print("\nExecuting content_creation pipeline...")
    print("This will:")
    print("  1. Generate content ideas based on brand context")
    print("  2. Generate captions for content drafts")
    print("  3. Generate images for content ideas")
    print("\nNote: This requires API keys to be configured in .env")

    try:
        result = orchestrator.execute_pipeline("content_creation", context)

        print(f"\n[Result]")
        print(f"  Success: {result['success']}")
        print(f"  Session ID: {result['session_id']}")
        print(f"  Steps completed: {len(result['steps_completed'])}")

        # Show generated content
        if result.get('agent_outputs', {}).get('content_drafts'):
            content_drafts = result['agent_outputs']['content_drafts']
            print(f"\n  Generated content ideas: {len(content_drafts)}")
            for i, draft in enumerate(content_drafts[:2], 1):
                print(f"\n    Idea {i}: {draft.get('title', 'N/A')}")
                print(f"    Type: {draft.get('content_type', 'N/A')}")

    except Exception as e:
        print(f"\n  [Error] {e}")
        print("  Make sure .env has GEMINI_API_KEY or GROQ_API_KEY configured")


def example_3_brand_onboarding():
    """Example 3: Brand onboarding with Instagram scraping"""
    print("\n" + "="*60)
    print("EXAMPLE 3: Brand Onboarding Pipeline")
    print("="*60)

    orchestrator = OrchestratorAgent()

    context = {
        "instagram_handle": "nasa"  # Public Instagram account
    }

    print("\nExecuting brand_onboarding pipeline...")
    print("This will:")
    print("  1. Scrape Instagram profile and posts for @nasa")
    print("  2. Analyze brand profile from scraped data")
    print("\nNote: Scraping may take 30-60 seconds")

    try:
        result = orchestrator.execute_pipeline("brand_onboarding", context)

        print(f"\n[Result]")
        print(f"  Success: {result['success']}")
        print(f"  Session ID: {result['session_id']}")

        # Show brand analysis
        if result.get('agent_outputs', {}).get('brand_context'):
            brand_ctx = result['agent_outputs']['brand_context']
            print(f"\n  Brand Analysis:")
            print(f"    Brand Voice: {brand_ctx.get('brand_voice', 'N/A')}")
            print(f"    Target Audience: {brand_ctx.get('target_audience', 'N/A')}")
            print(f"    Content Themes: {', '.join(brand_ctx.get('content_themes', [])[:3])}")

    except Exception as e:
        print(f"\n  [Error] {e}")


def example_4_dynamic_planning():
    """Example 4: Dynamic task planning by LLM"""
    print("\n" + "="*60)
    print("EXAMPLE 4: Dynamic Task Planning")
    print("="*60)

    orchestrator = OrchestratorAgent()

    task = "Analyze brand identity and generate 3 content ideas for Instagram"

    context = {
        "brand_profile": {
            "brand_voice": "casual",
            "target_audience": "millennials",
            "content_themes": ["lifestyle", "wellness", "travel"]
        }
    }

    print(f"\nTask: {task}")
    print("\nThe orchestrator will use AI to:")
    print("  1. Analyze the task")
    print("  2. Decide which agents to invoke")
    print("  3. Execute the plan")

    try:
        result = orchestrator.execute_dynamic(task, context)

        print(f"\n[Result]")
        print(f"  Success: {result['success']}")

        if result.get('plan'):
            plan = result['plan']
            print(f"\n  Execution Plan:")
            print(f"    Reasoning: {plan.get('reasoning', 'N/A')}")
            print(f"    Steps planned: {len(plan.get('steps', []))}")

            for i, step in enumerate(plan.get('steps', []), 1):
                print(f"\n      Step {i}: [{step['agent']}]")
                print(f"        Task: {step['task']}")

    except Exception as e:
        print(f"\n  [Error] {e}")


def example_5_execution_trace():
    """Example 5: Understanding execution traces"""
    print("\n" + "="*60)
    print("EXAMPLE 5: Execution Trace Analysis")
    print("="*60)

    orchestrator = OrchestratorAgent()

    context = {
        "brand_profile": {
            "brand_voice": "professional",
            "content_themes": ["business"]
        }
    }

    print("\nExecuting a simple pipeline and analyzing the trace...")

    try:
        result = orchestrator.execute_pipeline("content_creation", context)

        print(f"\n[Execution Trace]")
        print(f"  Session: {result.get('session_id', 'N/A')}")
        print(f"  Total steps: {len(result.get('execution_trace', []))}")

        # Show execution flow
        for step in result.get('execution_trace', []):
            status = "[OK]" if step['success'] else "[FAIL]"
            print(f"\n  {status} Agent: {step['agent_name']}")
            print(f"      Task: {step['task']}")
            print(f"      Duration: {step['duration_ms']}ms")
            print(f"      Input: {step['input_summary']}")
            print(f"      Output: {step['output_summary']}")

        # Show inter-agent messages
        messages = result.get('agent_messages', [])
        if messages:
            print(f"\n[Inter-Agent Messages] ({len(messages)} messages)")
            for msg in messages:
                print(f"  {msg['from_agent']} -> {msg['to_agent']}")
                print(f"    {msg['message']}")

    except Exception as e:
        print(f"\n  [Error] {e}")


def main():
    """Run all examples"""
    print("\n")
    print("#" * 60)
    print("#  ORCHESTRATOR & AGENTS - USAGE EXAMPLES")
    print("#" * 60)

    # Example 1: Simple - just list pipelines
    example_1_list_pipelines()

    # Example 2: Content creation (requires API keys)
    # Uncomment to run:
    # example_2_content_creation()

    # Example 3: Brand onboarding with scraping (requires API keys)
    # Uncomment to run:
    # example_3_brand_onboarding()

    # Example 4: Dynamic planning (requires API keys)
    # Uncomment to run:
    # example_4_dynamic_planning()

    # Example 5: Execution trace analysis (requires API keys)
    # Uncomment to run:
    # example_5_execution_trace()

    print("\n")
    print("="*60)
    print("To run examples that require LLM calls:")
    print("  1. Configure .env with GEMINI_API_KEY or GROQ_API_KEY")
    print("  2. Uncomment the example functions in main()")
    print("  3. Run: python example_orchestrator_usage.py")
    print("="*60)
    print()


if __name__ == "__main__":
    main()
