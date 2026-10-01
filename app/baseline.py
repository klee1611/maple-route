"""Phase 2: single-agent baseline over the Policy MCP tools."""

from langgraph.prebuilt import create_react_agent

from app import prompts
from app.config import settings
from app.llm import get_model
from app.mcp.client import policy_tools


async def answer(question: str) -> str:
    agent = create_react_agent(get_model("policy"), await policy_tools(), prompt=prompts.load("baseline"))
    # Each tool call costs two graph steps (model + tools), plus the final answer.
    result = await agent.ainvoke(
        {"messages": [("user", question)]},
        {"recursion_limit": 2 * settings.max_tool_calls_per_agent + 1},
    )
    return result["messages"][-1].content
