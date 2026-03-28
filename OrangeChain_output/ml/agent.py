"""
agent.py — LangGraph agent + SSE streaming + FastAPI routes
Imports tools from tools.py, browser sessions from browser.py

Routes added to your existing app via:
    from agent import agent_router
    app.include_router(agent_router)

Endpoints:
    GET  /agent/stream         → SSE: tool_call / tool_result / answer / browser_start / done
    POST /agent/resume         → SSE: resume after human_input_needed
    WS   /agent/browser/{sid}  → live playwright screenshots
    GET  /agent/history/{sid}  → full message history
"""

import uuid, asyncio, json, os
from typing import Annotated, Optional, AsyncGenerator
from typing_extensions import TypedDict
from dotenv import load_dotenv
load_dotenv()

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from tools import TOOLS                        # all @tool functions
from browser import browser_sessions           # live screenshot queues

GROQ_API_KEY = os.getenv("GROQ_API")


# ══════════════════════════════════════════════════════════════════════════════
# STATE
# ══════════════════════════════════════════════════════════════════════════════

class AgentState(TypedDict):
    messages:       Annotated[list, add_messages]
    awaiting_human: Optional[bool]


# ══════════════════════════════════════════════════════════════════════════════
# LLM
# ══════════════════════════════════════════════════════════════════════════════

_llm            = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY, temperature=0.2)
_llm_with_tools = _llm.bind_tools(TOOLS)

SYSTEM_PROMPT = """You are OrangeBot — AI assistant for orange farmers in Nagpur, India.
Tools: price prediction, market comparison, storage advice, cold storage search.

RULES:
1. Always call tools before giving price/market advice — never guess.
2. Sequential: if farmer wants cold storage in the "best" market, call compare_all_markets FIRST, then find_cold_storage with the winning city.
3. If any tool returns Error, continue with remaining data — do not panic.
4. Always end with a clear plain-language summary recommendation.
5. Be concise. Understand Hinglish.

Standard flow when farmer gives quantity + location:
  compare_all_markets → find_cold_storage (in best city) → summarise

If info is missing → ask human. Prefix EXACTLY: [HUMAN_INPUT_NEEDED]:"""


# ══════════════════════════════════════════════════════════════════════════════
# GRAPH NODES
# ══════════════════════════════════════════════════════════════════════════════

def _llm_node(state: AgentState) -> AgentState:
    msgs     = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = _llm_with_tools.invoke(msgs)
    return {"messages": [response], "awaiting_human": False}


def _human_pause_node(state: AgentState) -> AgentState:
    """Graph pauses here. /agent/resume resumes from this checkpoint."""
    return {"awaiting_human": True}


def _route(state: AgentState) -> str:
    last    = state["messages"][-1]
    content = getattr(last, "content", "")
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    if "[HUMAN_INPUT_NEEDED]" in content:
        return "human_pause"
    return END


# ══════════════════════════════════════════════════════════════════════════════
# BUILD GRAPH
# ══════════════════════════════════════════════════════════════════════════════

_memory    = MemorySaver()
_tool_node = ToolNode(TOOLS)

_graph = StateGraph(AgentState)
_graph.add_node("llm",         _llm_node)
_graph.add_node("tools",       _tool_node)
_graph.add_node("human_pause", _human_pause_node)

_graph.set_entry_point("llm")
_graph.add_conditional_edges("llm", _route, {
    "tools":       "tools",
    "human_pause": "human_pause",
    END:            END,
})
_graph.add_edge("tools",       "llm")
_graph.add_edge("human_pause", END)

agent = _graph.compile(checkpointer=_memory, interrupt_before=["human_pause"])


# ══════════════════════════════════════════════════════════════════════════════
# SSE STREAMING
# ══════════════════════════════════════════════════════════════════════════════

def _sse(obj: dict) -> str:
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


async def _stream(messages: list, session_id: str) -> AsyncGenerator[str, None]:
    config       = {"configurable": {"thread_id": session_id}}
    seen_ids: set = set()
    last_chunk   = {}

    async for chunk in agent.astream(
        {"messages": messages},
        config=config,
        stream_mode="values",
    ):
        last_chunk = chunk          # always keep track of latest chunk
        for msg in chunk.get("messages", []):
            mid = id(msg)
            if mid in seen_ids:
                continue
            seen_ids.add(mid)

            if isinstance(msg, AIMessage):
                # tool calls
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    for tc in msg.tool_calls:
                        yield _sse({"type": "tool_call", "name": tc["name"], "input": tc["args"]})
                        if tc["name"] == "find_cold_storage":
                            yield _sse({
                                "type":       "browser_start",
                                "session_id": session_id,
                                "city":       tc["args"].get("city", "Nagpur"),
                            })

                # text — only stream if NO tool calls (pure final response)
                # OR if it has both tool calls and content (rare but handle it)
                content = getattr(msg, "content", "")
                if isinstance(content, str) and content.strip():
                    # skip intermediate "thinking" messages that also have tool_calls
                    if not (hasattr(msg, "tool_calls") and msg.tool_calls):
                        waiting = "[HUMAN_INPUT_NEEDED]" in content
                        clean   = content.replace("[HUMAN_INPUT_NEEDED]:", "").strip()
                        if waiting:
                            yield _sse({"type": "human_input_needed", "question": clean})
                        elif clean:
                            words = clean.split(" ")
                            for i, word in enumerate(words):
                                yield _sse({"type": "answer",
                                            "text": word + (" " if i < len(words) - 1 else "")})
                                await asyncio.sleep(0.025)

            elif isinstance(msg, ToolMessage):
                yield _sse({"type": "tool_result",
                            "name":   msg.name,
                            "output": str(msg.content)[:500]})

    # ── safety net: if last message in final chunk is AI with content, stream it ──
    final_msgs = last_chunk.get("messages", [])
    if final_msgs:
        last = final_msgs[-1]
        if isinstance(last, AIMessage):
            content = getattr(last, "content", "")
            # only stream if we haven't already (id not in seen_ids means it's new)
            if id(last) not in seen_ids and isinstance(content, str) and content.strip():
                if not (hasattr(last, "tool_calls") and last.tool_calls):
                    clean = content.replace("[HUMAN_INPUT_NEEDED]:", "").strip()
                    if "[HUMAN_INPUT_NEEDED]" in content:
                        yield _sse({"type": "human_input_needed", "question": clean})
                    elif clean:
                        words = clean.split(" ")
                        for i, word in enumerate(words):
                            yield _sse({"type": "answer",
                                        "text": word + (" " if i < len(words) - 1 else "")})
                            await asyncio.sleep(0.025)

    yield _sse({"type": "done", "session_id": session_id})


# ══════════════════════════════════════════════════════════════════════════════
# FASTAPI ROUTER
# ══════════════════════════════════════════════════════════════════════════════

agent_router = APIRouter(tags=["OrangeBot Agent"])

_SSE_HEADERS = {
    "Cache-Control":      "no-cache",
    "X-Accel-Buffering":  "no",
    "Access-Control-Allow-Origin": "*",
}


class ResumeRequest(BaseModel):
    session_id:  str
    human_input: str


@agent_router.get("/agent/stream")
async def route_stream(
    message:    str = Query(...),
    session_id: str = Query(default=None),
):
    """
    SSE stream. Frontend: new EventSource(`/agent/stream?message=...&session_id=...`)
    Events: tool_call | tool_result | answer | browser_start | human_input_needed | done
    """
    sid = session_id or str(uuid.uuid4())
    return StreamingResponse(_stream([HumanMessage(content=message)], sid),
                             media_type="text/event-stream", headers=_SSE_HEADERS)


@agent_router.post("/agent/resume")
async def route_resume(req: ResumeRequest):
    """Resume after awaiting_human. Returns same SSE stream."""
    return StreamingResponse(_stream([HumanMessage(content=req.human_input)], req.session_id),
                             media_type="text/event-stream", headers=_SSE_HEADERS)


@agent_router.websocket("/agent/browser/{session_id}")
async def route_browser_ws(websocket: WebSocket, session_id: str):
    """
    Live browser screenshots.
    Frontend opens when it receives browser_start SSE event.
    Receives: { frame: "<base64_png>", action: "...", detail: "..." }
              { done: true }
    """
    await websocket.accept()
    try:
        # wait up to 10s for scraper to create session
        for _ in range(100):
            if session_id in browser_sessions:
                break
            await asyncio.sleep(0.1)

        session = browser_sessions.get(session_id)
        if not session:
            await websocket.send_json({"error": "Browser session not found"})
            return

        queue = session["queue"]
        while True:
            data = await queue.get()
            if data is None:
                continue
            await websocket.send_json(data)
            if data.get("done"):
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try: await websocket.send_json({"error": str(e)})
        except Exception: pass
    finally:
        try: await websocket.close()
        except Exception: pass


@agent_router.get("/agent/history/{session_id}")
def route_history(session_id: str):
    """Full message history for a session."""
    config = {"configurable": {"thread_id": session_id}}
    try:
        state = agent.get_state(config)
        msgs  = state.values.get("messages", [])
        return {
            "session_id": session_id,
            "messages": [
                {"role": "human" if isinstance(m, HumanMessage) else "ai",
                 "content": m.content}
                for m in msgs if hasattr(m, "content") and m.content
            ]
        }
    except Exception as e:
        raise HTTPException(404, str(e))