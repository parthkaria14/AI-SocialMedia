# Orchestrator Quick Start Guide

## ⚡ TL;DR - Your agents are integrated and ready!

The orchestrator system is fully configured with all agents working together.

---

## 🚀 Quick Test (30 seconds)

### Option 1: Python Script
```bash
cd project/backend
python example_orchestrator_usage.py
```
This will list all available pipelines.

### Option 2: Start API & Test
```bash
# Terminal 1: Start server
cd project/backend
python main.py

# Terminal 2: Test endpoint
curl http://localhost:8000/orchestrator/pipelines
```

---

## 📝 Available Pipelines

| Pipeline | Purpose | Time |
|----------|---------|------|
| `brand_onboarding` | Scrape & analyze Instagram | ~60s |
| `content_creation` | Generate ideas + captions + images | ~45s |
| `campaign_planning` | Brand + competitor analysis + strategy | ~90s |
| `competitive_strategy` | Full competitive analysis | ~120s |
| `full_workflow` | Complete end-to-end (all above) | ~180s |

---

## 💡 Example Usage

### Execute a Pipeline (API)
```bash
curl -X POST http://localhost:8000/orchestrator/execute \
  -H "Content-Type: application/json" \
  -d '{
    "pipeline": "content_creation",
    "brand_id": 1
  }'
```

### Execute via Python
```python
from agents.orchestrator import OrchestratorAgent

orchestrator = OrchestratorAgent()

result = orchestrator.execute_pipeline("content_creation", {
    "brand_profile": {
        "brand_voice": "casual",
        "target_audience": "millennials"
    }
})

print(f"Success: {result['success']}")
print(f"Session: {result['session_id']}")
print(f"Steps: {len(result['execution_trace'])}")
```

### Dynamic Task (Let AI Plan)
```python
result = orchestrator.execute_dynamic(
    task="Analyze my competitors and suggest content improvements",
    context={"instagram_handle": "your_brand"}
)

# AI will decide which agents to use
# Might invoke: competitor_analyzer → brand_analyzer → campaign_agent
```

---

## 🔍 Understanding Results

Every orchestrator call returns:

```python
{
    "success": True,
    "session_id": "abc123...",  # Track this execution

    # What happened
    "steps_completed": [...],    # Each agent step

    # What agents produced
    "agent_outputs": {
        "brand_context": {...},       # Brand analysis
        "content_drafts": [...],      # Content ideas
        "campaign_context": {...},    # Strategy
        "competitor_insights": {...}  # SWOT
    },

    # How agents communicated
    "agent_messages": [...],     # Agent-to-agent messages

    # Detailed trace
    "execution_trace": [...]     # Timing, inputs, outputs
}
```

---

## 🛠️ Configuration Check

All API keys are configured in `.env`:
- ✅ GEMINI_API_KEY (primary LLM)
- ✅ GROQ_API_KEY (fallback LLM)
- ✅ POLLINATIONS_API_KEY (image generation)

---

## 📊 Monitoring

### View Execution Log
```bash
# Get trace for a specific session
curl http://localhost:8000/orchestrator/trace/abc123...
```

### Database Logs
All executions are logged to `agency.db` in the `agent_logs` table:
- Session ID
- Agent name
- Task description
- Duration
- Success/failure
- Error details

---

## 🎯 Common Use Cases

### 1. Onboard New Brand
```python
orchestrator.execute_pipeline("brand_onboarding", {
    "instagram_handle": "nike"
})
# → Scrapes profile → Analyzes brand identity
```

### 2. Generate Content
```python
orchestrator.execute_pipeline("content_creation", {
    "brand_id": 1
})
# → Ideas → Captions → Images
```

### 3. Plan Campaign
```python
orchestrator.execute_pipeline("campaign_planning", {
    "brand_id": 1,
    "competitor_handles": ["competitor1", "competitor2"]
})
# → Brand analysis → Competitor SWOT → Strategy
```

### 4. Custom Task
```python
orchestrator.execute_dynamic(
    task="Review our last 10 posts and suggest improvements",
    context={"brand_id": 1}
)
# → AI figures out which agents to use
```

---

## 🎨 Agents Overview

Each agent specializes in one area:

| Agent | What It Does |
|-------|--------------|
| **BrandAnalyzer** | Analyzes brand voice, generates content |
| **CampaignAgent** | Plans campaigns, recommends ad platforms |
| **CompetitorAnalyzer** | SWOT analysis, trend identification |
| **ImageGenerator** | AI image generation |
| **InstagramScraper** | Scrapes profile data |

They all communicate via **SharedMemory** (blackboard pattern).

---

## 🐛 Troubleshooting

### Issue: Pipeline fails
**Check:**
1. API keys in `.env` are valid
2. Internet connection (for LLM calls)
3. Instagram handle exists (for scraping)

### Issue: Slow execution
**Normal:** Each LLM call takes 3-10 seconds
- `brand_onboarding`: ~60s (scraping + analysis)
- `full_workflow`: ~180s (7 agent steps)

### Issue: JSON parsing error
**Fix:** This is rare. The agents have fallback error handling.
Check `execution_trace` in result for the failing agent.

---

## 📚 Full Documentation

- **INTEGRATION_REPORT.md** - Complete integration details
- **ORCHESTRATOR_INTEGRATION.md** - Architecture & API reference
- **example_orchestrator_usage.py** - 5 detailed examples
- **test_orchestrator.py** - Test suite

---

## ✅ Verification Checklist

- [x] Orchestrator imports successfully
- [x] All 3 agents initialized
- [x] SharedMemory works (read/write/messaging)
- [x] API endpoints registered
- [x] Database logging configured
- [x] LLM integration with fallback
- [x] 5 pipelines defined
- [x] Dynamic planning enabled

**Status: Everything is integrated and working!** 🎉

---

## 🚀 Start Building

You're all set! The orchestrator can now:
- Coordinate multiple AI agents
- Execute complex multi-step workflows
- Track every action with detailed traces
- Scale to custom tasks via dynamic planning

**Try it now:**
```bash
python example_orchestrator_usage.py
```

Or jump straight to the API:
```bash python main.py
# Then visit http://localhost:8000/docs
```

Happy automating! 🤖✨
