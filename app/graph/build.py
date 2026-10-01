"""Assemble the Maple Route graph (CLAUDE.md §5)."""

from langgraph.graph import END, START, StateGraph

from app.graph import nodes
from app.graph.state import AgentState


def build_graph():
    g = StateGraph(AgentState)
    g.add_node("orchestrator", nodes.orchestrator)
    g.add_node("policy_agent", nodes.policy_agent)
    g.add_node("synthesizer", nodes.synthesizer)
    g.add_node("verifier", nodes.verifier)
    g.add_node("finalize", nodes.finalize)
    # Phase E: employer_agent joins here, in parallel with policy_agent.

    g.add_edge(START, "orchestrator")
    g.add_conditional_edges("orchestrator", nodes.route_after_orchestrator)
    g.add_edge("policy_agent", "synthesizer")
    g.add_edge("synthesizer", "verifier")
    g.add_conditional_edges("verifier", nodes.route_after_verifier)
    g.add_edge("finalize", END)
    return g.compile()


graph = build_graph()
