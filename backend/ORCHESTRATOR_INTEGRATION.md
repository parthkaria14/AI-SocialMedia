# Orchestrator & Agent Integration Status

## ✅ Integration Complete

The orchestrator and all specialist agents are fully integrated and ready to use.

---

## System Architecture

### Core Components

1. **OrchestratorAgent** (`agents/orchestrator.py`)
   - Coordinates all specialist agents
   - Supports predefined pipelines and dynamic planning
   - Manages agent execution order via SharedMemory

2. **BaseAgent** (`agents/base_agent.py`)
   - Abstract base class for all agents
   - Provides LLM integration (Gemini + Groq fallback)
   - Standard `execute(task, shared_memory)` interface
   - JSON parsing utilities

3. **SharedMemory** (`agents/shared_memory.py`)
   - Blackboard pattern for agent collaboration
   - Agent-to-agent messaging
   - Execution trace logging
   - Data sections for different contexts

4. **Specialist Agents**
   - **BrandAnalyzer** (`agents/brand_analyzer.py`)
     - Analyzes brand profiles from social media data
     - Generates content ideas and captions
     - Analyzes performance metrics

   - **CampaignAgent** (`agents/campaign_agent.py`)
     - Generates marketing strategies
     - Recommends ad platforms
     - Analyzes campaign performance

   - **CompetitorAnalyzer** (`agents/competitor_analyzer.py`)
     - Scrapes and analyzes competitors
     - Performs SWOT analysis
     - Identifies trending content

---

## Available Pipelines

The orchestrator includes 5 predefined multi-agent workflows:

### 1. `brand_onboarding`
Scrape Instagram data and analyze brand identity
```
Steps:
  1. [scraper] Scrape Instagram profile and posts
  2. [brand_analyzer] Analyze brand profile from scraped data
```

### 2. `content_creation`
Generate content ideas, captions, and images
```
Steps:
  1. [brand_analyzer] Generate content ideas based on brand context
  2. [brand_analyzer] Generate captions for content drafts
  3. [image_generator] Generate images for content ideas
```

### 3. `campaign_planning`
Analyze brand + competitors, then generate campaign strategy
```
Steps:
  1. [brand_analyzer] Analyze brand profile from scraped data
  2. [competitor_analyzer] Compare brand with competitors and perform SWOT analysis
  3. [campaign_agent] Generate campaign strategy based on brand and competitor analysis
```

### 4. `competitive_strategy`
Full competitive analysis → ad recommendations → content
```
Steps:
  1. [competitor_analyzer] Compare brand with competitors and perform SWOT analysis
  2. [campaign_agent] Recommend ad platforms based on competitive landscape
  3. [campaign_agent] Generate campaign strategy informed by competitor analysis
  4. [brand_analyzer] Generate content ideas aligned with campaign strategy
```

### 5. `full_workflow`
Complete end-to-end pipeline
```
Steps:
  1. [scraper] Scrape Instagram profile and posts
  2. [brand_analyzer] Analyze brand profile from scraped data
  3. [competitor_analyzer] Compare brand with competitors and perform SWOT analysis
  4. [campaign_agent] Generate campaign strategy based on brand and competitor analysis
  5. [brand_analyzer] Generate content ideas aligned with campaign strategy
  6. [brand_analyzer] Generate captions for content drafts
  7. [image_generator] Generate images for content ideas
```

---

## API Endpoints

All orchestrator endpoints are registered in `main.py`:

### GET `/orchestrator/pipelines`
List all available multi-agent pipelines
```bash
curl http://localhost:8000/orchestrator/pipelines
```

### POST `/orchestrator/execute`
Execute a predefined pipeline
```bash
curl -X POST http://localhost:8000/orchestrator/execute \
  -H "Content-Type: application/json" \
  -d '{
    "pipeline": "content_creation",
    "brand_id": 1,
    "instagram_handle": "your_brand",
    "competitor_handles": ["competitor1", "competitor2"]
  }'
```

**Request Body:**
```json
{
  "pipeline": "brand_onboarding | content_creation | campaign_planning | competitive_strategy | full_workflow",
  "brand_id": 1,
  "instagram_handle": "optional",
  "competitor_handles": ["optional"]
}
```

### POST `/orchestrator/dynamic`
Execute a dynamically planned multi-agent task (LLM plans the workflow)
```bash
curl -X POST http://localhost:8000/orchestrator/dynamic \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Create a social media campaign for a new product launch",
    "brand_id": 1,
    "instagram_handle": "your_brand"
  }'
```

**Request Body:**
```json
{
  "task": "natural language task description",
  "brand_id": 1,
  "instagram_handle": "optional",
  "competitor_handles": ["optional"]
}
```

### GET `/orchestrator/trace/{session_id}`
Get the execution trace for a specific orchestrator session
```bash
curl http://localhost:8000/orchestrator/trace/abc123def456
```

---

## Response Format

All orchestrator endpoints return a comprehensive execution result:

```json
{
  "success": true,
  "session_id": "unique-session-id",
  "pipeline": "content_creation",
  "pipeline_name": "Content Creation Pipeline",
  "steps_completed": [
    {
      "step": 1,
      "agent": "brand_analyzer",
      "task": "Generate content ideas",
      "success": true,
      "summary": "Generated 5 content ideas for instagram"
    }
  ],
  "agent_outputs": {
    "brand_context": {...},
    "content_drafts": [...],
    "campaign_context": {...}
  },
  "agent_messages": [
    {
      "from_agent": "brand_analyzer",
      "to_agent": "campaign_agent",
      "message": "Content ideas generated",
      "data": {...}
    }
  ],
  "execution_trace": [
    {
      "agent_name": "brand_analyzer",
      "task": "Generate content ideas",
      "started_at": "2024-01-01T00:00:00",
      "completed_at": "2024-01-01T00:00:05",
      "duration_ms": 5000,
      "input_summary": "Using brand voice: casual",
      "output_summary": "Generated 5 content ideas",
      "success": true,
      "error": null
    }
  ],
  "contributors": [
    {
      "agent": "brand_analyzer",
      "key": "content_drafts",
      "timestamp": "2024-01-01T00:00:05"
    }
  ]
}
```

---

## How It Works

### 1. Predefined Pipelines

```python
from agents.orchestrator import OrchestratorAgent

orchestrator = OrchestratorAgent()

context = {
    "instagram_handle": "your_brand",
    "competitor_handles": ["competitor1", "competitor2"]
}

result = orchestrator.execute_pipeline("full_workflow", context)

# Access results
brand_profile = result["agent_outputs"]["brand_context"]
content_ideas = result["agent_outputs"]["content_drafts"]
campaign_strategy = result["agent_outputs"]["campaign_context"]
```

### 2. Dynamic Planning

```python
result = orchestrator.execute_dynamic(
    task="Analyze our competitors and suggest content improvements",
    context={"instagram_handle": "your_brand"}
)

# Orchestrator uses LLM to plan which agents to invoke
# result includes the plan and execution trace
```

### 3. SharedMemory Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SharedMemory (Blackboard)                 │
│                                                              │
│  Sections:                                                   │
│  - brand_context        (BrandAnalyzer writes)               │
│  - competitor_insights  (CompetitorAnalyzer writes)          │
│  - campaign_context     (CampaignAgent writes)               │
│  - content_drafts       (BrandAnalyzer writes)               │
│  - image_results        (ImageGenerator writes)              │
│                                                              │
│  Messages:                                                   │
│  - Agent-to-agent communication                              │
│  - Read-once semantics                                       │
│                                                              │
│  Trace:                                                      │
│  - Full execution log of all agent steps                     │
└─────────────────────────────────────────────────────────────┘
         ↑                    ↑                    ↑
         │                    │                    │
         │                    │                    │
   ┌─────┴─────┐        ┌─────┴─────┐       ┌─────┴─────┐
   │  Brand    │        │ Competitor │       │ Campaign  │
   │ Analyzer  │←──────→│ Analyzer   │←─────→│  Agent    │
   └───────────┘        └────────────┘       └───────────┘
```

---

## Testing

Run the integration tests:

```bash
# Full test suite (requires UTF-8 terminal)
python test_orchestrator.py

# Simple verification
python verify_integration.py
```

Test files included:
- `test_orchestrator.py` - Comprehensive test suite with 6 test scenarios
- `verify_integration.py` - Simple integration verification script

---

## Database Integration

The orchestrator automatically persists execution traces to the database:

```python
class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True)
    session_id = Column(String)
    agent_name = Column(String)
    task = Column(String)
    input_summary = Column(String)
    output_summary = Column(String)
    success = Column(Boolean)
    error = Column(Text, nullable=True)
    duration_ms = Column(Integer)
    timestamp = Column(DateTime, default=datetime.utcnow)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
```

All orchestrator runs are automatically logged for auditing and analytics.

---

## Usage Examples

### Example 1: Brand Onboarding

```python
# POST /orchestrator/execute
{
  "pipeline": "brand_onboarding",
  "instagram_handle": "nike"
}

# Result:
# - Scrapes Nike's Instagram profile and posts
# - Analyzes brand voice, target audience, content themes
# - Returns brand profile in agent_outputs.brand_context
```

### Example 2: Content Campaign

```python
# POST /orchestrator/execute
{
  "pipeline": "full_workflow",
  "brand_id": 1,
  "instagram_handle": "your_brand",
  "competitor_handles": ["competitor1", "competitor2"]
}

# Result:
# - Complete analysis + strategy + content + images
# - All outputs available in agent_outputs
# - Full trace of all 7 agent steps
```

### Example 3: Dynamic Task

```python
# POST /orchestrator/dynamic
{
  "task": "Compare our engagement rates with competitors and recommend improvements",
  "brand_id": 1
}

# Result:
# - LLM plans which agents to use
# - Executes planned steps
# - Returns analysis and recommendations
```

---

## Key Features

✅ **Multi-Agent Coordination** - Orchestrator manages agent execution order and dependencies

✅ **Shared Memory** - Agents communicate via blackboard pattern

✅ **Agent Messaging** - Direct agent-to-agent communication with read-once semantics

✅ **Execution Tracing** - Full logging of all agent steps with timing and I/O summaries

✅ **Predefined Pipelines** - 5 proven workflows for common use cases

✅ **Dynamic Planning** - LLM-based task decomposition for flexible workflows

✅ **Database Persistence** - Automatic logging of all orchestrator runs

✅ **LLM Fallback** - Gemini with Groq backup for reliability

✅ **REST API** - Full FastAPI integration with typed request/response models

✅ **Session Tracking** - Unique session IDs for tracing and debugging

---

## Next Steps

1. **Start the server:**
   ```bash
   cd project/backend
   python main.py
   ```

2. **Test the orchestrator:**
   ```bash
   # List available pipelines
   curl http://localhost:8000/orchestrator/pipelines

   # Execute a pipeline
   curl -X POST http://localhost:8000/orchestrator/execute \
     -H "Content-Type: application/json" \
     -d '{"pipeline": "content_creation", "brand_id": 1}'
   ```

3. **Monitor execution:**
   - Check console logs for agent activity
   - Query `/orchestrator/trace/{session_id}` for detailed trace
   - Check `agent_logs` table in database

---

## Status: ✅ READY FOR PRODUCTION

All components are integrated, tested, and ready to use. The orchestrator can now coordinate complex multi-agent workflows for social media marketing automation.
