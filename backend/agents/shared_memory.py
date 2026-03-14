"""
Shared Memory (Blackboard Pattern) - Enables agent-to-agent communication.

All agents read from and write to this shared context during a multi-agent
workflow. The orchestrator creates a SharedMemory instance per task session,
and passes it to each agent in sequence.
"""

import uuid
from datetime import datetime


class AgentMessage:
    """A message sent from one agent to another via shared memory."""
    
    def __init__(self, from_agent: str, to_agent: str, message: str, data: dict = None):
        self.id = str(uuid.uuid4())[:8]
        self.from_agent = from_agent
        self.to_agent = to_agent
        self.message = message
        self.data = data or {}
        self.timestamp = datetime.utcnow().isoformat()
        self.read = False
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "from_agent": self.from_agent,
            "to_agent": self.to_agent,
            "message": self.message,
            "data": self.data,
            "timestamp": self.timestamp,
            "read": self.read
        }


class ExecutionStep:
    """A single step in the agent execution trace."""
    
    def __init__(self, agent_name: str, task: str):
        self.agent_name = agent_name
        self.task = task
        self.started_at = datetime.utcnow()
        self.completed_at = None
        self.duration_ms = 0
        self.input_summary = ""
        self.output_summary = ""
        self.success = False
        self.error = None
    
    def complete(self, success: bool, output_summary: str = "", error: str = None):
        self.completed_at = datetime.utcnow()
        self.duration_ms = int((self.completed_at - self.started_at).total_seconds() * 1000)
        self.success = success
        self.output_summary = output_summary
        self.error = error
    
    def to_dict(self) -> dict:
        return {
            "agent_name": self.agent_name,
            "task": self.task,
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration_ms": self.duration_ms,
            "input_summary": self.input_summary,
            "output_summary": self.output_summary,
            "success": self.success,
            "error": self.error
        }


class SharedMemory:
    """
    Blackboard/shared workspace for multi-agent collaboration.
    
    Agents write their outputs here, and subsequent agents read from it.
    Also supports direct agent-to-agent messaging.
    
    Sections:
    - brand_context: Brand profile, voice, audience (written by BrandAnalyzer)
    - competitor_insights: SWOT, trends, gaps (written by CompetitorAnalyzer)
    - content_drafts: Generated content ideas and captions (written by BrandAnalyzer)
    - campaign_context: Strategy, recommendations (written by CampaignAgent)
    - image_results: Generated images (written by ImageGenerator)
    - agent_messages: Direct messages between agents
    - execution_log: Full trace of all agent steps
    """
    
    def __init__(self, task_description: str = ""):
        self.session_id = str(uuid.uuid4())
        self.created_at = datetime.utcnow().isoformat()
        self.task_description = task_description
        
        # Agent output sections
        self._data = {
            "brand_context": {},
            "competitor_insights": {},
            "content_drafts": [],
            "campaign_context": {},
            "image_results": [],
            "scraped_data": {},
        }
        
        # Agent-to-agent messaging
        self._messages: list[AgentMessage] = []
        
        # Execution trace
        self._execution_log: list[ExecutionStep] = []
        
        # Track which agents have contributed
        self._contributors: list[dict] = []
    
    # ─── Data Read/Write ───────────────────────────────────────────
    
    def write(self, agent_name: str, key: str, value, merge: bool = False):
        """
        Write data to shared memory.
        
        Args:
            agent_name: Name of the agent writing
            key: Section key (e.g., 'brand_context', 'content_drafts')
            value: Data to write
            merge: If True and existing value is a dict, merge instead of replace
        """
        if key not in self._data:
            self._data[key] = value
        elif merge and isinstance(self._data[key], dict) and isinstance(value, dict):
            self._data[key].update(value)
        elif isinstance(self._data[key], list) and isinstance(value, list):
            self._data[key].extend(value)
        else:
            self._data[key] = value
        
        # Track contribution
        self._contributors.append({
            "agent": agent_name,
            "key": key,
            "timestamp": datetime.utcnow().isoformat()
        })
    
    def read(self, key: str, default=None):
        """Read data from shared memory."""
        return self._data.get(key, default)
    
    def read_all(self) -> dict:
        """Get all data in shared memory."""
        return dict(self._data)
    
    # ─── Agent-to-Agent Messaging ──────────────────────────────────
    
    def send_message(self, from_agent: str, to_agent: str, message: str, data: dict = None):
        """
        Send a direct message from one agent to another.
        The recipient can read these messages when it executes.
        """
        msg = AgentMessage(from_agent, to_agent, message, data)
        self._messages.append(msg)
        return msg.id
    
    def get_messages_for(self, agent_name: str, mark_read: bool = True) -> list[dict]:
        """Get all unread messages addressed to a specific agent."""
        messages = []
        for msg in self._messages:
            if msg.to_agent == agent_name and not msg.read:
                messages.append(msg.to_dict())
                if mark_read:
                    msg.read = True
        return messages
    
    def get_all_messages(self) -> list[dict]:
        """Get all messages (for execution trace)."""
        return [msg.to_dict() for msg in self._messages]
    
    # ─── Execution Logging ─────────────────────────────────────────
    
    def start_step(self, agent_name: str, task: str, input_summary: str = "") -> ExecutionStep:
        """Log the start of an agent execution step."""
        step = ExecutionStep(agent_name, task)
        step.input_summary = input_summary
        self._execution_log.append(step)
        return step
    
    def get_execution_trace(self) -> list[dict]:
        """Get the full execution trace."""
        return [step.to_dict() for step in self._execution_log]
    
    def get_contributors(self) -> list[dict]:
        """Get list of all agent contributions."""
        return list(self._contributors)
    
    # ─── Summary ───────────────────────────────────────────────────
    
    def to_summary(self) -> dict:
        """Get a complete summary of the shared memory state."""
        return {
            "session_id": self.session_id,
            "task_description": self.task_description,
            "created_at": self.created_at,
            "data_keys": {k: type(v).__name__ for k, v in self._data.items() if v},
            "total_messages": len(self._messages),
            "total_steps": len(self._execution_log),
            "contributors": self._contributors,
            "execution_trace": self.get_execution_trace(),
            "agent_messages": self.get_all_messages()
        }
    
    def to_full_output(self) -> dict:
        """Get full output including all data, messages, and trace."""
        return {
            "session_id": self.session_id,
            "task_description": self.task_description,
            "created_at": self.created_at,
            "data": self._data,
            "agent_messages": self.get_all_messages(),
            "execution_trace": self.get_execution_trace(),
            "contributors": self._contributors
        }
