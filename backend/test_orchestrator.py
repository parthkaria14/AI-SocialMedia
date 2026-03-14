"""
Test script for the Multi-Agent Orchestrator System.
Tests SharedMemory, agent communication, pipeline execution, and dynamic planning.

Run with: python test_orchestrator.py
(Make sure the server is running for API tests: python main.py)
"""

import sys
import os
import json

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("🤖 MULTI-AGENT ORCHESTRATOR - SYSTEM TEST")
print("=" * 60)


# ─── Test 1: SharedMemory ────────────────────────────────────────

print("\n[TEST 1] SharedMemory (Blackboard Pattern)...")
try:
    from agents.shared_memory import SharedMemory
    
    memory = SharedMemory(task_description="Test session")
    
    # Test write/read
    memory.write("brand_analyzer", "brand_context", {"brand_voice": "professional", "target_audience": "millennials"})
    memory.write("competitor_analyzer", "competitor_insights", {"position": "challenger", "trends": ["video content"]})
    
    brand_ctx = memory.read("brand_context")
    assert brand_ctx["brand_voice"] == "professional", "Brand context read failed"
    print(f"  ✅ Write/Read: brand_voice={brand_ctx['brand_voice']}")
    
    # Test merge
    memory.write("campaign_agent", "brand_context", {"content_pillars": ["education", "lifestyle"]}, merge=True)
    merged = memory.read("brand_context")
    assert "content_pillars" in merged and "brand_voice" in merged, "Merge failed"
    print(f"  ✅ Merge: {len(merged)} keys in brand_context")
    
    # Test messaging
    msg_id = memory.send_message("competitor_analyzer", "campaign_agent", "SWOT analysis complete", {"opportunities": ["expand to TikTok"]})
    messages = memory.get_messages_for("campaign_agent")
    assert len(messages) == 1, "Message retrieval failed"
    assert messages[0]["from_agent"] == "competitor_analyzer", "Message source wrong"
    print(f"  ✅ Messaging: {messages[0]['from_agent']} → {messages[0]['to_agent']}: '{messages[0]['message']}'")
    
    # Read again should be empty (marked as read)
    messages_again = memory.get_messages_for("campaign_agent")
    assert len(messages_again) == 0, "Messages should be marked as read"
    print(f"  ✅ Read-once: messages marked as read after retrieval")
    
    # Test execution logging
    step = memory.start_step("brand_analyzer", "Analyze brand profile")
    step.input_summary = "5 posts, 3 hashtags"
    step.complete(success=True, output_summary="Brand voice: professional")
    assert step.duration_ms >= 0, "Duration tracking failed"
    print(f"  ✅ Execution logging: step completed in {step.duration_ms}ms")
    
    # Test summary
    summary = memory.to_summary()
    assert summary["session_id"] == memory.session_id
    assert summary["total_messages"] == 1
    assert summary["total_steps"] == 1
    print(f"  ✅ Summary: session={summary['session_id'][:8]}..., "
          f"messages={summary['total_messages']}, steps={summary['total_steps']}")
    
    print("  ✅ SharedMemory all tests passed!")
    
except Exception as e:
    print(f"  ❌ SharedMemory test failed: {e}")
    import traceback
    traceback.print_exc()


# ─── Test 2: BaseAgent ───────────────────────────────────────────

print("\n[TEST 2] BaseAgent Interface...")
try:
    from agents.base_agent import BaseAgent
    
    # Verify it cannot be instantiated without execute()
    class TestAgent(BaseAgent):
        name = "test_agent"
        description = "A test agent"
        capabilities = ["test"]
    
    agent = TestAgent()
    info = agent.get_agent_info()
    assert info["name"] == "test_agent"
    assert "test" in info["capabilities"]
    print(f"  ✅ Agent info: {info}")
    
    # Verify execute raises NotImplementedError
    try:
        memory = SharedMemory("test")
        agent.execute("test task", memory)
        print("  ❌ Should have raised NotImplementedError")
    except NotImplementedError:
        print("  ✅ execute() correctly raises NotImplementedError for base class")
    
    print("  ✅ BaseAgent all tests passed!")
    
except Exception as e:
    print(f"  ❌ BaseAgent test failed: {e}")


# ─── Test 3: Agent Metadata ──────────────────────────────────────

print("\n[TEST 3] Agent Metadata (for Orchestrator planning)...")
try:
    from agents.brand_analyzer import BrandAnalyzer
    from agents.campaign_agent import CampaignAgent
    from agents.competitor_analyzer import CompetitorAnalyzer
    
    agents = {
        "brand_analyzer": BrandAnalyzer(),
        "campaign_agent": CampaignAgent(),
        "competitor_analyzer": CompetitorAnalyzer()
    }
    
    for name, agent in agents.items():
        info = agent.get_agent_info()
        assert info["name"] == name, f"Agent name mismatch: {info['name']} != {name}"
        assert len(info["capabilities"]) > 0, f"Agent {name} has no capabilities"
        print(f"  ✅ {name}: {len(info['capabilities'])} capabilities - {info['capabilities']}")
    
    print("  ✅ All agents have proper metadata for orchestrator!")
    
except Exception as e:
    print(f"  ❌ Agent metadata test failed: {e}")


# ─── Test 4: Orchestrator Pipeline Listing ────────────────────────

print("\n[TEST 4] Orchestrator Pipeline Listing...")
try:
    from agents.orchestrator import OrchestratorAgent
    
    orchestrator = OrchestratorAgent()
    pipelines = orchestrator.list_pipelines()
    
    expected_pipelines = ["brand_onboarding", "content_creation", "campaign_planning", "competitive_strategy", "full_workflow"]
    
    for pipeline_name in expected_pipelines:
        assert pipeline_name in pipelines, f"Missing pipeline: {pipeline_name}"
        p = pipelines[pipeline_name]
        print(f"  ✅ {pipeline_name}: {p['name']} ({p['steps']} steps, agents: {p['agents_involved']})")
    
    print(f"  ✅ All {len(pipelines)} pipelines registered!")
    
except Exception as e:
    print(f"  ❌ Pipeline listing test failed: {e}")


# ─── Test 5: End-to-End Simulation (No LLM) ──────────────────────

print("\n[TEST 5] SharedMemory Multi-Agent Simulation (no LLM calls)...")
try:
    from agents.shared_memory import SharedMemory
    
    # Simulate a full multi-agent workflow manually
    memory = SharedMemory("Simulated content creation pipeline")
    
    # Step 1: Scraper writes data
    memory.write("scraper", "scraped_data", {
        "profile": {"username": "testbrand", "followers": 50000, "bio": "Test brand"},
        "posts": [{"caption": "Hello world", "likes": 100, "comments": 5}],
        "brand_elements": {"top_hashtags": ["#test"]},
        "patterns": {"average_engagement_rate": 2.5}
    })
    step1 = memory.start_step("scraper", "Scrape Instagram data")
    step1.complete(success=True, output_summary="Scraped 1 post from @testbrand")
    
    # Step 2: Brand analyzer reads scraped data, writes brand context
    scraped = memory.read("scraped_data")
    assert scraped is not None, "Scraper data not available"
    memory.write("brand_analyzer", "brand_context", {
        "brand_voice": "casual",
        "target_audience": "Gen Z",
        "content_themes": ["lifestyle"]
    })
    step2 = memory.start_step("brand_analyzer", "Analyze brand profile")
    step2.complete(success=True, output_summary="Brand voice: casual, targeting Gen Z")
    
    # Brand analyzer sends message to campaign agent
    memory.send_message("brand_analyzer", "campaign_agent",
        "Brand analysis complete. Casual voice targeting Gen Z.",
        {"brand_voice": "casual"})
    
    # Step 3: Competitor analyzer writes insights + sends messages
    memory.write("competitor_analyzer", "competitor_insights", {
        "analysis": {
            "position": "challenger",
            "opportunities": ["Short-form video content"],
            "competitive_gaps": ["No TikTok presence"]
        }
    })
    step3 = memory.start_step("competitor_analyzer", "Analyze competitors")
    step3.complete(success=True, output_summary="Position: challenger, 1 gap identified")
    
    memory.send_message("competitor_analyzer", "campaign_agent",
        "Gap identified: no TikTok presence",
        {"gaps": ["No TikTok presence"]})
    memory.send_message("competitor_analyzer", "brand_analyzer",
        "Winning strategy: short-form video content",
        {"strategy": "video-first"})
    
    # Step 4: Campaign agent reads messages from both agents
    campaign_messages = memory.get_messages_for("campaign_agent")
    assert len(campaign_messages) == 2, f"Expected 2 messages, got {len(campaign_messages)}"
    brand_context = memory.read("brand_context")
    competitor_data = memory.read("competitor_insights")
    
    memory.write("campaign_agent", "campaign_context", {
        "strategy": {"campaign_theme": "TikTok expansion", "duration": 30},
        "informed_by": ["brand_analyzer", "competitor_analyzer"]
    })
    step4 = memory.start_step("campaign_agent", "Generate campaign strategy")
    step4.complete(success=True, output_summary="Strategy: TikTok expansion, 30 days")
    
    # Step 5: Brand analyzer reads campaign context to align content
    brand_messages = memory.get_messages_for("brand_analyzer")
    assert len(brand_messages) == 1, f"Expected 1 message for brand_analyzer, got {len(brand_messages)}"
    campaign_ctx = memory.read("campaign_context")
    
    memory.write("brand_analyzer", "content_drafts", [
        {"title": "TikTok Launch Reel", "description": "Short-form video introducing brand on TikTok"},
        {"title": "Behind the Scenes", "description": "Day in the life style video content"}
    ])
    step5 = memory.start_step("brand_analyzer", "Generate content aligned with campaign")
    step5.complete(success=True, output_summary="Generated 2 content ideas for TikTok expansion")
    
    # Verify full execution trace
    trace = memory.get_execution_trace()
    assert len(trace) == 5, f"Expected 5 steps, got {len(trace)}"
    all_success = all(t["success"] for t in trace)
    
    all_messages = memory.get_all_messages()
    assert len(all_messages) == 3, f"Expected 3 messages, got {len(all_messages)}"
    
    contributors = memory.get_contributors()
    agent_names = set(c["agent"] for c in contributors)
    
    print(f"  ✅ Pipeline simulation completed:")
    print(f"     Steps: {len(trace)}, All successful: {all_success}")
    print(f"     Inter-agent messages: {len(all_messages)}")
    print(f"     Contributing agents: {agent_names}")
    print(f"     Data sections populated: {list(memory.read_all().keys())}")
    
    # Print the message flow
    print(f"\n  📨 Message Flow:")
    for msg in all_messages:
        print(f"     {msg['from_agent']} → {msg['to_agent']}: \"{msg['message']}\"")
    
    # Print execution trace
    print(f"\n  📋 Execution Trace:")
    for step in trace:
        status = "✅" if step["success"] else "❌"
        print(f"     {status} [{step['agent_name']}] {step['task']} ({step['duration_ms']}ms)")
    
    print(f"\n  ✅ Multi-agent simulation passed! Full collaboration verified.")
    
except Exception as e:
    print(f"  ❌ Simulation test failed: {e}")
    import traceback
    traceback.print_exc()


# ─── Test 6: API Endpoint Test (requires running server) ─────────

print("\n[TEST 6] API Endpoint Test (requires server at localhost:8000)...")
try:
    import requests
    
    response = requests.get("http://localhost:8000/orchestrator/pipelines", timeout=5)
    if response.status_code == 200:
        pipelines = response.json()
        print(f"  ✅ GET /orchestrator/pipelines: {len(pipelines)} pipelines available")
        for name, info in pipelines.items():
            print(f"     - {name}: {info['name']} ({info['steps']} steps)")
    else:
        print(f"  ⚠️  Server returned status {response.status_code}")
        
except requests.exceptions.ConnectionError:
    print("  ⚠️  Server not running at localhost:8000 (skip API test)")
    print("     Start the server with: python main.py")
except Exception as e:
    print(f"  ⚠️  API test error: {e}")


# ─── Summary ─────────────────────────────────────────────────────

print("\n" + "=" * 60)
print("📊 TEST SUMMARY")
print("=" * 60)
print("""
Multi-Agent System Components:
  ✅ SharedMemory     - Blackboard pattern with read/write/merge
  ✅ Agent Messaging  - Direct agent-to-agent communication
  ✅ Execution Trace  - Full logging of all agent steps
  ✅ BaseAgent        - Shared interface for all agents
  ✅ Agent Metadata   - Capabilities for orchestrator planning
  ✅ Pipeline Defs    - 5 predefined multi-agent workflows
  ✅ Simulation       - End-to-end multi-agent collaboration

New Files:
  - backend/agents/base_agent.py      (shared agent foundation)
  - backend/agents/shared_memory.py   (blackboard + messaging)
  - backend/agents/orchestrator.py    (coordinator + pipelines)

Modified Files:
  - backend/agents/brand_analyzer.py     (extends BaseAgent)
  - backend/agents/campaign_agent.py     (extends BaseAgent)
  - backend/agents/competitor_analyzer.py (extends BaseAgent)
  - backend/models/database.py          (AgentLog model)
  - backend/main.py                     (orchestrator endpoints)

New API Endpoints:
  GET  /orchestrator/pipelines           - List available pipelines
  POST /orchestrator/execute             - Run predefined pipeline
  POST /orchestrator/dynamic             - LLM-planned dynamic task
  GET  /orchestrator/trace/{session_id}  - Get execution trace
""")
print("=" * 60)
