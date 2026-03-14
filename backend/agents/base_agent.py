"""
Base Agent - Shared foundation for all AI agents in the multi-agent system.
Provides unified LLM generation, JSON parsing, and shared memory integration.
"""

import google.generativeai as genai
from groq import Groq
import os
import json
import re
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()


class BaseAgent:
    """
    Abstract base class for all AI agents.
    
    Every agent has:
    - name, description, capabilities (metadata for the orchestrator)
    - _generate_content() with Gemini + Groq fallback
    - _parse_json_response() for LLM output parsing
    - execute(task, shared_memory) for orchestrator-driven workflows
    """
    
    name: str = "base_agent"
    description: str = "Base agent"
    capabilities: list = []
    
    def __init__(self):
        # Primary: Gemini
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Backup: Groq
        self.groq_client = Groq(api_key=os.getenv('GROQ_API_KEY'))
        self.groq_model = "openai/gpt-oss-120b"
    
    def _generate_content(self, prompt: str) -> str:
        """
        Generate content using Gemini with Groq fallback.
        Returns the raw text response.
        """
        gemini_error = None
        
        # Try Gemini first
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            gemini_error = e
            print(f"[{self.name}] Gemini failed: {e}. Falling back to Groq...")
        
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
            print(f"[{self.name}] Groq also failed: {groq_error}")
            raise Exception(f"Both Gemini and Groq failed. Gemini: {gemini_error}, Groq: {groq_error}")
    
    def _parse_json_response(self, result: str):
        """Parse JSON from AI response, handling markdown code blocks, extra data, and common issues."""
        text = result.strip()
        
        # Remove markdown code blocks
        if text.startswith('```json'):
            text = text[7:]
        elif text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
        
        text = text.strip()
        
        # Fix common JSON issues from LLM
        # Remove trailing commas before } or ]
        text = re.sub(r',\s*([}\]])', r'\1', text)
        # Remove JavaScript-style comments
        text = re.sub(r'//.*?\n', '\n', text)
        
        # Try standard parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        # Handle "Extra data" — LLM returned valid JSON followed by extra text.
        # Use raw_decode to parse only the first JSON object/array.
        try:
            decoder = json.JSONDecoder()
            obj, _ = decoder.raw_decode(text)
            return obj
        except json.JSONDecodeError:
            pass
        
        # Last resort: try to extract JSON from anywhere in the text
        # Find the first { or [ and match to its closing counterpart
        for start_char, end_char in [('{', '}'), ('[', ']')]:
            start_idx = text.find(start_char)
            if start_idx == -1:
                continue
            
            # Find matching closing bracket by counting depth
            depth = 0
            for i in range(start_idx, len(text)):
                if text[i] == start_char:
                    depth += 1
                elif text[i] == end_char:
                    depth -= 1
                    if depth == 0:
                        candidate = text[start_idx:i+1]
                        try:
                            return json.loads(candidate)
                        except json.JSONDecodeError:
                            break
        
        # If all else fails, raise with the original text for debugging
        raise json.JSONDecodeError(f"Could not parse JSON from LLM response", text, 0)
    
    def execute(self, task: str, shared_memory) -> dict:
        """
        Main entry point called by the orchestrator.
        
        Each agent overrides this to:
        1. Read relevant context from shared_memory
        2. Perform its specialized work
        3. Write results back to shared_memory
        4. Optionally send messages to other agents
        
        Args:
            task: Description of what to do
            shared_memory: SharedMemory instance for inter-agent communication
            
        Returns:
            dict with 'success', 'data', and optional 'messages_sent'
        """
        raise NotImplementedError(f"{self.name} must implement execute()")
    
    def get_agent_info(self) -> dict:
        """Return metadata about this agent (used by orchestrator for planning)."""
        return {
            "name": self.name,
            "description": self.description,
            "capabilities": self.capabilities
        }
