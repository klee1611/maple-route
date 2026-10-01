"""MCP connections to Sanity Context endpoints (read-only)."""

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.client import MultiServerMCPClient

from app.config import settings


def _connection(url: str, transport: str) -> dict:
    conn: dict = {"transport": transport, "url": url, "timeout": settings.http_timeout_s}
    if settings.sanity_read_token:
        conn["headers"] = {"Authorization": f"Bearer {settings.sanity_read_token}"}
    return conn


def make_client(transport: str | None = None) -> MultiServerMCPClient:
    transport = transport or settings.mcp_transport
    connections = {}
    if settings.policy_mcp_url:
        connections["policy"] = _connection(settings.policy_mcp_url, transport)
    if settings.employer_mcp_url:
        connections["employer"] = _connection(settings.employer_mcp_url, transport)
    if not connections:
        raise RuntimeError("No MCP endpoint configured (set SANITY_POLICY_MCP_URL)")
    return MultiServerMCPClient(connections)


async def policy_tools() -> list[BaseTool]:
    return await make_client().get_tools(server_name="policy")
