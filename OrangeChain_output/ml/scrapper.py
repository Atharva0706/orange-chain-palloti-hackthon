# # # """
# # # Orange Chain — Streaming Agent + Live Browser Feed
# # # Enhanced with Grok-style real-time browser visibility

# # # New endpoints:
# # #   GET  /agent/stream        → SSE stream (tool calls + thinking + final answer)
# # #   WS   /agent/browser/{sid} → WebSocket: live browser screenshots + action logs
# # #   POST /agent/resume        → resume after human_input_needed
# # #   GET  /agent/history/{sid} → message history

# # # SSE event types sent to frontend:
# # #   { type: "tool_call",   name: "...", input: {...} }
# # #   { type: "tool_result", name: "...", output: "..." }
# # #   { type: "thinking",    text: "..." }
# # #   { type: "answer",      text: "..." }
# # #   { type: "human_input_needed", question: "..." }
# # #   { type: "browser_start", session_id: "...", city: "..." }
# # #   { type: "browser_action", action: "...", detail: "..." }  ← NEW: live action updates
# # #   { type: "done" }
# # # """

# # # import uuid, asyncio, re as _re, json, base64, os
# # # from typing import Annotated, Optional, AsyncGenerator
# # # from typing_extensions import TypedDict

# # # from dotenv import load_dotenv
# # # load_dotenv()

# # # from langchain_groq import ChatGroq
# # # from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
# # # from langchain_core.tools import tool
# # # from langgraph.graph import StateGraph, END
# # # from langgraph.graph.message import add_messages
# # # from langgraph.prebuilt import ToolNode
# # # from langgraph.checkpoint.memory import MemorySaver

# # # from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query
# # # from fastapi.responses import StreamingResponse
# # # from pydantic import BaseModel
# # # import requests as _http
# # # from playwright.async_api import async_playwright, Page as _Page

# # # GROQ_API_KEY = os.getenv("GROQ_API")
# # # _API_BASE    = "http://127.0.0.1:8000"


# # # class AgentState(TypedDict):
# # #     messages:       Annotated[list, add_messages]
# # #     awaiting_human: Optional[bool]


# # # # ══════════════════════════════════════════════════════════════════════════════
# # # # TOOLS
# # # # ══════════════════════════════════════════════════════════════════════════════

# # # @tool
# # # def get_price_prediction(market: str, date: str = None) -> str:
# # #     """Price prediction + demand signal + recommendation. market e.g. 'Nagpur APMC'. date optional YYYY-MM-DD."""
# # #     try:
# # #         params = {"market": market}
# # #         if date: params["date"] = date
# # #         d = _http.get(f"{_API_BASE}/predict", params=params, timeout=5).json()
# # #         return (
# # #             f"Market: {d['market']}\n"
# # #             f"Predicted: ₹{d['predicted_prices']['modal_price']}/quintal\n"
# # #             f"Net after transport: ₹{d['net_price']}/quintal\n"
# # #             f"Signal: {d['demand_signal']['signal']} — {d['demand_signal']['pressure']}\n"
# # #             f"Advice: {d['demand_signal']['advice']}\n"
# # #             f"Recommendation: {d['recommendation']}"
# # #         )
# # #     except Exception as e:
# # #         return f"Error: {e}"


# # # @tool
# # # def compare_all_markets(date: str = None) -> str:
# # #     """All markets ranked by net profit after transport. Best mandi to sell today."""
# # #     try:
# # #         d    = _http.get(f"{_API_BASE}/compare-markets", params={"date": date} if date else {}, timeout=10).json()
# # #         top3 = d['all_markets'][:3]
# # #         out  = f"Best: {d['summary']}\n\nTop 3:\n"
# # #         for i, m in enumerate(top3, 1):
# # #             out += f"{i}. {m['market']} — ₹{m['net_price']}/quintal (signal: {m['signal']})\n"
# # #         return out
# # #     except Exception as e:
# # #         return f"Error: {e}"


# # # @tool
# # # def get_storage_advice(market: str, quantity: float, days: int = 28) -> str:
# # #     """Sell now or store? market, quantity in quintals, days window."""
# # #     try:
# # #         d = _http.get(f"{_API_BASE}/storage-optimizer",
# # #                       params={"market": market, "quantity": quantity, "days": days}, timeout=5).json()
# # #         return (
# # #             f"Current price: ₹{d['current_price']}/quintal\n"
# # #             f"Sell now: ₹{d['sell_now_revenue']}\n"
# # #             f"Optimal: hold {d['optimal_day']} days → extra ₹{d['optimal_net_gain']}/quintal\n"
# # #             f"Advice: {d['advice']}"
# # #         )
# # #     except Exception as e:
# # #         return f"Error: {e}"


# # # @tool
# # # def get_7day_forecast(market: str) -> str:
# # #     """7-day price forecast with trend."""
# # #     try:
# # #         d   = _http.get(f"{_API_BASE}/forecast", params={"market": market, "days": 7}, timeout=5).json()
# # #         out = f"Forecast {market} (trend: {d['trend']}):\n"
# # #         for e in d['forecast']:
# # #             out += f"  Day {e['day']} ({e['date']}): ₹{e['modal_price']}/quintal\n"
# # #         return out
# # #     except Exception as e:
# # #         return f"Error: {e}"


# # # @tool
# # # def get_demand_signal(market: str) -> str:
# # #     """Demand pressure — OVERSUPPLY / UNDERSUPPLY / BALANCED."""
# # #     try:
# # #         d = _http.get(f"{_API_BASE}/demand-signal", params={"market": market}, timeout=5).json()
# # #         return (
# # #             f"Signal: {d['signal']} — {d['pressure']}\n"
# # #             f"Vol ratio: {d['vol_ratio']} | Momentum: ₹{d['price_momentum']}\n"
# # #             f"Advice: {d['advice']}"
# # #         )
# # #     except Exception as e:
# # #         return f"Error: {e}"


# # # @tool
# # # def find_cold_storage(city: str = "Nagpur") -> str:
# # #     """
# # #     Search IndiaMART for cold storage near a city. Opens live browser (visible on webpage).
# # #     city: e.g. 'Nagpur', 'Amravati'
# # #     """
# # #     try:
# # #         data = asyncio.run(_scrape_with_live_feed(city))
# # #         if not data:
# # #             return f"No cold storage found near {city}."
# # #         out = f"Cold storage near {city}:\n\n"
# # #         for r in data:
# # #             out += f"{r['rank']}. {r['name']}\n"
# # #             out += f"   {r['location']} | {r['phone']}\n"
# # #             if r["rating"]:     out += f"   {r['rating']} ★\n"
# # #             if r["trust_seal"]: out += f"   ✓ TrustSEAL\n"
# # #             out += "\n"
# # #         return out
# # #     except Exception as e:
# # #         return f"Scraping error: {e}"


# # # _TOOLS     = [get_price_prediction, compare_all_markets, get_storage_advice,
# # #               get_7day_forecast, get_demand_signal, find_cold_storage]


# # # # ══════════════════════════════════════════════════════════════════════════════
# # # # LIVE BROWSER STREAMING WITH ACTION LOGS
# # # # ══════════════════════════════════════════════════════════════════════════════

# # # _browser_sessions: dict[str, dict] = {}  # sid -> {queue: asyncio.Queue, actions: list}


# # # async def _scrape_with_live_feed(city: str) -> list[dict]:
# # #     """
# # #     Scrape IndiaMART with LIVE streaming of browser actions and screenshots.
# # #     This creates that Grok-style 'watch the agent work' experience.
# # #     """
# # #     sid = str(uuid.uuid4())
# # #     queue = asyncio.Queue()
# # #     actions = []
# # #     _browser_sessions[sid] = {"queue": queue, "actions": actions}
    
# # #     results = []
    
# # #     async def send_frame(page, action: str = None, detail: str = None):
# # #         """Capture screenshot and queue it with optional action info"""
# # #         png = await page.screenshot(type="png", full_page=False)
# # #         frame_data = {
# # #             "frame": base64.b64encode(png).decode(),
# # #             "action": action,
# # #             "detail": detail,
# # #             "timestamp": asyncio.get_event_loop().time()
# # #         }
# # #         await queue.put(frame_data)
# # #         if action:
# # #             actions.append({"action": action, "detail": detail})
    
# # #     async with async_playwright() as p:
# # #         # Launch browser - headless but with viewport for screenshots
# # #         browser = await p.chromium.launch(
# # #             headless=True,  # Keep headless for server, but screenshots show everything
# # #             args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
# # #         )
        
# # #         context = await browser.new_context(
# # #             user_agent=(
# # #                 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
# # #                 "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
# # #             ),
# # #             viewport={"width": 1280, "height": 900},
# # #             device_scale_factor=1
# # #         )
        
# # #         page = await context.new_page()
        
# # #         # ═══════════════════════════════════════════════════════════════════
# # #         # STEP 1: Navigate to IndiaMART
# # #         # ═══════════════════════════════════════════════════════════════════
# # #         await send_frame(page, "navigate", "Opening IndiaMART cold storage page...")
        
# # #         await page.goto(
# # #             "https://dir.indiamart.com/impcat/vegetable-cold-storage.html",
# # #             wait_until="domcontentloaded",
# # #             timeout=30000
# # #         )
# # #         await page.wait_for_timeout(1500)
# # #         await send_frame(page, "loaded", "Page loaded successfully")
        
# # #         # ═══════════════════════════════════════════════════════════════════
# # #         # STEP 2: Close any popup
# # #         # ═══════════════════════════════════════════════════════════════════
# # #         try:
# # #             await send_frame(page, "action", "Looking for popup to close...")
# # #             close_btn = await page.wait_for_selector(".close-btn", timeout=4000)
# # #             if close_btn:
# # #                 await close_btn.click()
# # #                 await page.wait_for_timeout(500)
# # #                 await send_frame(page, "clicked", "Closed popup dialog")
# # #         except Exception:
# # #             await send_frame(page, "info", "No popup found, continuing...")
        
# # #         # ═══════════════════════════════════════════════════════════════════
# # #         # STEP 3: Find and click the city input
# # #         # ═══════════════════════════════════════════════════════════════════
# # #         await send_frame(page, "action", f"Searching for city input field...")
        
# # #         try:
# # #             # Try multiple selectors for the city input
# # #             city_input = None
# # #             selectors = [
# # #                 'input[placeholder*="City" i]',
# # #                 'input[placeholder*="city" i]',
# # #                 'input[placeholder*="location" i]',
# # #                 'input[name*="city" i]',
# # #                 'input[id*="city" i]',
# # #                 '.city-input input',
# # #                 '[data-testid*="city"] input'
# # #             ]
            
# # #             for selector in selectors:
# # #                 try:
# # #                     city_input = await page.wait_for_selector(selector, timeout=2000)
# # #                     if city_input:
# # #                         await send_frame(page, "found", f"Found city input: {selector}")
# # #                         break
# # #                 except:
# # #                     continue
            
# # #             if not city_input:
# # #                 # Try to find any input that might be for location
# # #                 city_input = await page.query_selector('input[type="text"]')
# # #                 if city_input:
# # #                     await send_frame(page, "found", "Using first text input as city field")
            
# # #             if city_input:
# # #                 await city_input.click()
# # #                 await send_frame(page, "clicked", "Clicked on city input field")
# # #                 await page.wait_for_timeout(300)
                
# # #                 # Clear and type city name
# # #                 await city_input.fill("")
# # #                 await send_frame(page, "typing", f"Typing '{city}'...")
                
# # #                 # Type character by character for visual effect
# # #                 for char in city:
# # #                     await city_input.type(char, delay=50)
# # #                     if ord(char) % 2 == 0:  # Capture every other char for performance
# # #                         await send_frame(page, "typing", f"Typing '{city}'... ({char})")
                
# # #                 await page.wait_for_timeout(1000)
# # #                 await send_frame(page, "typed", f"City name '{city}' entered")
                
# # #                 # ═══════════════════════════════════════════════════════════
# # #                 # STEP 4: Select from dropdown
# # #                 # ═══════════════════════════════════════════════════════════
# # #                 await send_frame(page, "action", "Waiting for dropdown suggestions...")
# # #                 await page.wait_for_timeout(1500)
                
# # #                 # Try to find and click dropdown option
# # #                 dropdown_selectors = [
# # #                     '.suggestion-item',
# # #                     '.dropdown-item',
# # #                     '[role="option"]',
# # #                     '.autocomplete-item',
# # #                     'li[class*="suggest"]'
# # #                 ]
                
# # #                 dropdown_clicked = False
# # #                 for selector in dropdown_selectors:
# # #                     try:
# # #                         option = await page.wait_for_selector(selector, timeout=2000)
# # #                         if option:
# # #                             await option.click()
# # #                             dropdown_clicked = True
# # #                             await send_frame(page, "selected", f"Selected from dropdown: {selector}")
# # #                             break
# # #                     except:
# # #                         continue
                
# # #                 if not dropdown_clicked:
# # #                     # Press Enter as fallback
# # #                     await city_input.press("Enter")
# # #                     await send_frame(page, "submitted", "Pressed Enter to search")
                
# # #                 await page.wait_for_timeout(3000)
# # #                 await send_frame(page, "searched", f"Search results for '{city}' loaded")
                
# # #         except Exception as e:
# # #             await send_frame(page, "error", f"City input error: {str(e)[:50]}")
        
# # #         # ═══════════════════════════════════════════════════════════════════
# # #         # STEP 5: Close any popup again
# # #         # ═══════════════════════════════════════════════════════════════════
# # #         try:
# # #             close_btn = await page.wait_for_selector(".close-btn", timeout=2000)
# # #             if close_btn:
# # #                 await close_btn.click()
# # #                 await send_frame(page, "clicked", "Closed secondary popup")
# # #         except:
# # #             pass
        
# # #         # ═══════════════════════════════════════════════════════════════════
# # #         # STEP 6: Wait for and extract results
# # #         # ═══════════════════════════════════════════════════════════════════
# # #         await send_frame(page, "action", "Waiting for supplier cards to load...")
        
# # #         card_selectors = [
# # #             ".supplierInfoDiv",
# # #             ".supplier-card",
# # #             "[data-testid='supplier-card']",
# # #             ".card.supplier"
# # #         ]
        
# # #         cards = None
# # #         for selector in card_selectors:
# # #             try:
# # #                 await page.wait_for_selector(selector, timeout=5000)
# # #                 cards = page.locator(selector)
# # #                 count = await cards.count()
# # #                 if count > 0:
# # #                     await send_frame(page, "found", f"Found {count} supplier cards")
# # #                     break
# # #             except:
# # #                 continue
        
# # #         if cards:
# # #             total = await cards.count()
# # #             await send_frame(page, "extracting", f"Extracting data from {min(total, 8)} suppliers...")
            
# # #             for i in range(min(total, 8)):
# # #                 try:
# # #                     card = cards.nth(i)
                    
# # #                     # Scroll card into view for screenshot
# # #                     await card.scroll_into_view_if_needed()
# # #                     if i % 2 == 0:
# # #                         await send_frame(page, "scrolling", f"Processing supplier {i+1}/{min(total, 8)}...")
                    
# # #                     # Extract data
# # #                     name = ""
# # #                     try:
# # #                         name_elem = await card.locator(".companyname a, .company-name, h3, .title").first.inner_text(timeout=1000)
# # #                         name = name_elem.strip()
# # #                     except:
# # #                         name = f"Supplier {i+1}"
                    
# # #                     loc = ""
# # #                     try:
# # #                         loc_elem = await card.locator(".newLocationUi .highlight, .location, .address").first.inner_text(timeout=1000)
# # #                         loc = loc_elem.strip()
# # #                     except:
# # #                         pass
                    
# # #                     rating = ""
# # #                     try:
# # #                         rating_elem = await card.locator(".bo.color, .rating, .stars").first.inner_text(timeout=1000)
# # #                         rating = rating_elem.strip()
# # #                     except:
# # #                         pass
                    
# # #                     trust = False
# # #                     try:
# # #                         trust_text = await card.locator(".lh11.cp.fs10, .trust-badge").first.inner_text(timeout=1000)
# # #                         trust = "TrustSEAL" in trust_text
# # #                     except:
# # #                         pass
                    
# # #                     phone = "N/A"
# # #                     try:
# # #                         phone_elem = await card.locator(".pns_h, .phone, .contact").first.inner_text(timeout=1500)
# # #                         phone_text = phone_elem.strip()
# # #                         hits = _re.findall(r'\d{10}', phone_text.replace(" ", ""))
# # #                         phone = hits[0] if hits else phone_text[:20]
# # #                     except:
# # #                         pass
                    
# # #                     if name:
# # #                         results.append({
# # #                             "rank": i+1,
# # #                             "name": name,
# # #                             "location": loc,
# # #                             "phone": phone,
# # #                             "rating": rating,
# # #                             "trust_seal": trust
# # #                         })
                        
# # #                 except Exception as e:
# # #                     continue
            
# # #             await send_frame(page, "complete", f"Extracted {len(results)} suppliers successfully")
# # #         else:
# # #             await send_frame(page, "error", "No supplier cards found on page")
        
# # #         await browser.close()
    
# # #     # Send completion signal
# # #     await queue.put({"done": True, "results_count": len(results)})
    
# # #     # Clean up session after a delay
# # #     async def cleanup():
# # #         await asyncio.sleep(60)
# # #         _browser_sessions.pop(sid, None)
    
# # #     asyncio.create_task(cleanup())
    
# # #     return results


# # # # ══════════════════════════════════════════════════════════════════════════════
# # # # LLM + GRAPH
# # # # ══════════════════════════════════════════════════════════════════════════════

# # # _llm            = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY, temperature=0.2)
# # # _llm_with_tools = _llm.bind_tools(_TOOLS)

# # # _SYSTEM = """You are OrangeBot — AI assistant for orange farmers in Nagpur, India.
# # # Tools: price prediction, market comparison, storage advice, cold storage search.

# # # Rules:
# # # - Always call tools before giving price/market advice
# # # - ONE clear final recommendation
# # # - Concise. Understand Hinglish.

# # # Flow when farmer gives quantity + location:
# # # 1. get_demand_signal → 2. get_storage_advice → 3. compare_all_markets → 4. summarise

# # # If info missing → ask human. Prefix with: [HUMAN_INPUT_NEEDED]:"""


# # # def _llm_node(state: AgentState) -> AgentState:
# # #     msgs     = [SystemMessage(content=_SYSTEM)] + state["messages"]
# # #     response = _llm_with_tools.invoke(msgs)
# # #     return {"messages": [response], "awaiting_human": False}


# # # def _route(state: AgentState) -> str:
# # #     last    = state["messages"][-1]
# # #     content = getattr(last, "content", "")
# # #     if hasattr(last, "tool_calls") and last.tool_calls:  return "tools"
# # #     if "[HUMAN_INPUT_NEEDED]" in content:                return "human_pause"
# # #     return END


# # # def _human_pause_node(state: AgentState) -> AgentState:
# # #     return {"awaiting_human": True}


# # # _memory    = MemorySaver()
# # # _tool_node = ToolNode(_TOOLS)
# # # _graph     = StateGraph(AgentState)
# # # _graph.add_node("llm",         _llm_node)
# # # _graph.add_node("tools",       _tool_node)
# # # _graph.add_node("human_pause", _human_pause_node)
# # # _graph.set_entry_point("llm")
# # # _graph.add_conditional_edges("llm", _route,
# # #                               {"tools": "tools", "human_pause": "human_pause", END: END})
# # # _graph.add_edge("tools", "llm")
# # # _graph.add_edge("human_pause", END)
# # # _agent = _graph.compile(checkpointer=_memory, interrupt_before=["human_pause"])


# # # # ══════════════════════════════════════════════════════════════════════════════
# # # # SSE STREAMING HELPER
# # # # ══════════════════════════════════════════════════════════════════════════════

# # # def _sse(obj: dict) -> str:
# # #     return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


# # # async def _stream_agent(messages: list, session_id: str) -> AsyncGenerator[str, None]:
# # #     config = {"configurable": {"thread_id": session_id}}
# # #     seen_ids: set = set()
    
# # #     async for chunk in _agent.astream(
# # #         {"messages": messages},
# # #         config=config,
# # #         stream_mode="values",
# # #     ):
# # #         msgs = chunk.get("messages", [])
# # #         for msg in msgs:
# # #             mid = id(msg)
# # #             if mid in seen_ids:
# # #                 continue
# # #             seen_ids.add(mid)
            
# # #             # AI message with tool calls
# # #             if hasattr(msg, "tool_calls") and msg.tool_calls:
# # #                 for tc in msg.tool_calls:
# # #                     yield _sse({"type": "tool_call", "name": tc["name"], "input": tc["args"]})
                    
# # #                     # If it's cold storage → tell frontend to open browser WS
# # #                     if tc["name"] == "find_cold_storage":
# # #                         city = tc["args"].get("city", "Nagpur")
# # #                         yield _sse({
# # #                             "type": "browser_start",
# # #                             "session_id": session_id,
# # #                             "city": city
# # #                         })
            
# # #             # Tool result
# # #             elif isinstance(msg, ToolMessage):
# # #                 yield _sse({
# # #                     "type": "tool_result",
# # #                     "name": msg.name,
# # #                     "output": msg.content[:500]  # slightly longer for more info
# # #                 })
            
# # #             # AI final text
# # #             elif hasattr(msg, "content") and msg.content:
# # #                 content = msg.content
# # #                 waiting = "[HUMAN_INPUT_NEEDED]" in content
# # #                 clean   = content.replace("[HUMAN_INPUT_NEEDED]:", "").strip()
# # #                 if waiting:
# # #                     yield _sse({"type": "human_input_needed", "question": clean})
# # #                 else:
# # #                     # Stream word by word
# # #                     words = clean.split(" ")
# # #                     for i, word in enumerate(words):
# # #                         chunk_text = word + (" " if i < len(words) - 1 else "")
# # #                         yield _sse({"type": "answer", "text": chunk_text})
# # #                         await asyncio.sleep(0.025)
    
# # #     yield _sse({"type": "done", "session_id": session_id})


# # # # ══════════════════════════════════════════════════════════════════════════════
# # # # FASTAPI ROUTES
# # # # ══════════════════════════════════════════════════════════════════════════════

# # # agent_router = APIRouter(tags=["OrangeBot Agent"])


# # # class AgentChatRequest(BaseModel):
# # #     message:    str
# # #     session_id: str = None


# # # class AgentResumeRequest(BaseModel):
# # #     session_id:  str
# # #     human_input: str


# # # @agent_router.get("/agent/stream")
# # # async def agent_stream(
# # #     message:    str = Query(...),
# # #     session_id: str = Query(default=None),
# # # ):
# # #     """
# # #     SSE endpoint. Frontend connects with EventSource.
# # #     Streams tool calls, tool results, and final answer word-by-word.
# # #     """
# # #     sid = session_id or str(uuid.uuid4())
# # #     return StreamingResponse(
# # #         _stream_agent([HumanMessage(content=message)], sid),
# # #         media_type="text/event-stream",
# # #         headers={
# # #             "Cache-Control": "no-cache",
# # #             "X-Accel-Buffering": "no",
# # #             "Access-Control-Allow-Origin": "*",
# # #         }
# # #     )


# # # @agent_router.post("/agent/resume")
# # # async def agent_resume(req: AgentResumeRequest):
# # #     """Resume after human_input_needed. Returns SSE stream."""
# # #     return StreamingResponse(
# # #         _stream_agent([HumanMessage(content=req.human_input)], req.session_id),
# # #         media_type="text/event-stream",
# # #         headers={
# # #             "Cache-Control": "no-cache",
# # #             "X-Accel-Buffering": "no",
# # #             "Access-Control-Allow-Origin": "*"
# # #         }
# # #     )


# # # @agent_router.websocket("/agent/browser/{session_id}")
# # # async def browser_ws(websocket: WebSocket, session_id: str):
# # #     """
# # #     WebSocket endpoint for LIVE browser streaming.
    
# # #     Sends JSON objects:
# # #       { "frame": "<base64_png>", "action": "...", "detail": "..." }
# # #       { "done": true, "results_count": N }
    
# # #     Frontend displays frame in <img> and shows action log.
# # #     """
# # #     await websocket.accept()
    
# # #     try:
# # #         # Wait for session to be created (with timeout)
# # #         for _ in range(100):  # 10 seconds
# # #             if session_id in _browser_sessions:
# # #                 break
# # #             await asyncio.sleep(0.1)
        
# # #         session = _browser_sessions.get(session_id)
# # #         if not session:
# # #             await websocket.send_json({"error": "Browser session not found or expired"})
# # #             await websocket.close()
# # #             return
        
# # #         queue = session["queue"]
# # #         sent_actions = set()
        
# # #         while True:
# # #             data = await queue.get()
            
# # #             if data is None:
# # #                 continue
                
# # #             if data.get("done"):
# # #                 await websocket.send_json(data)
# # #                 break
            
# # #             # Send the frame data
# # #             await websocket.send_json(data)
            
# # #     except WebSocketDisconnect:
# # #         pass
# # #     except Exception as e:
# # #         try:
# # #             await websocket.send_json({"error": str(e)})
# # #         except:
# # #             pass
# # #     finally:
# # #         try:
# # #             await websocket.close()
# # #         except:
# # #             pass


# # # @agent_router.get("/agent/history/{session_id}")
# # # def agent_history(session_id: str):
# # #     config = {"configurable": {"thread_id": session_id}}
# # #     try:
# # #         state = _agent.get_state(config)
# # #         msgs  = state.values.get("messages", [])
# # #         return {
# # #             "session_id": session_id,
# # #             "messages": [
# # #                 {"role": "human" if isinstance(m, HumanMessage) else "ai",
# # #                  "content": m.content}
# # #                 for m in msgs if hasattr(m, "content") and m.content
# # #             ]
# # #         }
# # #     except Exception as e:
# # #         raise HTTPException(404, str(e))
# # """
# # Orange Chain — Streaming Agent + Live Browser Feed
# # Enhanced with Grok-style real-time browser visibility

# # New endpoints:
# #   GET  /agent/stream        → SSE stream (tool calls + thinking + final answer)
# #   WS   /agent/browser/{sid} → WebSocket: live browser screenshots + action logs
# #   POST /agent/resume        → resume after human_input_needed
# #   GET  /agent/history/{sid} → message history

# # SSE event types sent to frontend:
# #   { type: "tool_call",   name: "...", input: {...} }
# #   { type: "tool_result", name: "...", output: "..." }
# #   { type: "thinking",    text: "..." }
# #   { type: "answer",      text: "..." }
# #   { type: "human_input_needed", question: "..." }
# #   { type: "browser_start", session_id: "...", city: "..." }
# #   { type: "browser_action", action: "...", detail: "..." }  ← NEW: live action updates
# #   { type: "done" }
# # """

# # import uuid, asyncio, re as _re, json, base64, os
# # from typing import Annotated, Optional, AsyncGenerator
# # from typing_extensions import TypedDict

# # from dotenv import load_dotenv
# # load_dotenv()

# # from langchain_groq import ChatGroq
# # from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
# # from langchain_core.tools import tool
# # from langchain_core.runnables import RunnableConfig  # <-- ADDED
# # from langgraph.graph import StateGraph, END
# # from langgraph.graph.message import add_messages
# # from langgraph.prebuilt import ToolNode
# # from langgraph.checkpoint.memory import MemorySaver

# # from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query
# # from fastapi.responses import StreamingResponse
# # from pydantic import BaseModel
# # import requests as _http
# # from playwright.async_api import async_playwright, Page as _Page

# # GROQ_API_KEY = os.getenv("GROQ_API")
# # _API_BASE    = "http://127.0.0.1:8000"


# # class AgentState(TypedDict):
# #     messages:       Annotated[list, add_messages]
# #     awaiting_human: Optional[bool]


# # # ══════════════════════════════════════════════════════════════════════════════
# # # TOOLS
# # # ══════════════════════════════════════════════════════════════════════════════

# # @tool
# # def get_price_prediction(market: str, date: str = None) -> str:
# #     """Price prediction + demand signal + recommendation. market e.g. 'Nagpur APMC'. date optional YYYY-MM-DD."""
# #     try:
# #         params = {"market": market}
# #         if date: params["date"] = date
# #         d = _http.get(f"{_API_BASE}/predict", params=params, timeout=5).json()
# #         return (
# #             f"Market: {d['market']}\n"
# #             f"Predicted: ₹{d['predicted_prices']['modal_price']}/quintal\n"
# #             f"Net after transport: ₹{d['net_price']}/quintal\n"
# #             f"Signal: {d['demand_signal']['signal']} — {d['demand_signal']['pressure']}\n"
# #             f"Advice: {d['demand_signal']['advice']}\n"
# #             f"Recommendation: {d['recommendation']}"
# #         )
# #     except Exception as e:
# #         return f"Error: {e}"


# # @tool
# # def compare_all_markets(date: str = None) -> str:
# #     """All markets ranked by net profit after transport. Best mandi to sell today."""
# #     try:
# #         d    = _http.get(f"{_API_BASE}/compare-markets", params={"date": date} if date else {}, timeout=10).json()
# #         top3 = d['all_markets'][:3]
# #         out  = f"Best: {d['summary']}\n\nTop 3:\n"
# #         for i, m in enumerate(top3, 1):
# #             out += f"{i}. {m['market']} — ₹{m['net_price']}/quintal (signal: {m['signal']})\n"
# #         return out
# #     except Exception as e:
# #         return f"Error: {e}"


# # @tool
# # def get_storage_advice(market: str, quantity: float, days: int = 28) -> str:
# #     """Sell now or store? market, quantity in quintals, days window."""
# #     try:
# #         d = _http.get(f"{_API_BASE}/storage-optimizer",
# #                       params={"market": market, "quantity": quantity, "days": days}, timeout=5).json()
# #         return (
# #             f"Current price: ₹{d['current_price']}/quintal\n"
# #             f"Sell now: ₹{d['sell_now_revenue']}\n"
# #             f"Optimal: hold {d['optimal_day']} days → extra ₹{d['optimal_net_gain']}/quintal\n"
# #             f"Advice: {d['advice']}"
# #         )
# #     except Exception as e:
# #         return f"Error: {e}"


# # @tool
# # def get_7day_forecast(market: str) -> str:
# #     """7-day price forecast with trend."""
# #     try:
# #         d   = _http.get(f"{_API_BASE}/forecast", params={"market": market, "days": 7}, timeout=5).json()
# #         out = f"Forecast {market} (trend: {d['trend']}):\n"
# #         for e in d['forecast']:
# #             out += f"  Day {e['day']} ({e['date']}): ₹{e['modal_price']}/quintal\n"
# #         return out
# #     except Exception as e:
# #         return f"Error: {e}"


# # @tool
# # def get_demand_signal(market: str) -> str:
# #     """Demand pressure — OVERSUPPLY / UNDERSUPPLY / BALANCED."""
# #     try:
# #         d = _http.get(f"{_API_BASE}/demand-signal", params={"market": market}, timeout=5).json()
# #         return (
# #             f"Signal: {d['signal']} — {d['pressure']}\n"
# #             f"Vol ratio: {d['vol_ratio']} | Momentum: ₹{d['price_momentum']}\n"
# #             f"Advice: {d['advice']}"
# #         )
# #     except Exception as e:
# #         return f"Error: {e}"


# # # <-- FIXED TOOL: Native Async + RunnableConfig for SID
# # @tool
# # async def find_cold_storage(city: str, config: RunnableConfig) -> str:
# #     """
# #     Search IndiaMART for cold storage near a city. Opens live browser (visible on webpage).
# #     city: e.g. 'Nagpur', 'Amravati'
# #     """
# #     try:
# #         # Extract the exact session ID from the chat thread!
# #         sid = config.get("configurable", {}).get("thread_id", str(uuid.uuid4()))
        
# #         # Await it directly, passing down the SID
# #         data = await _scrape_with_live_feed(city, sid)
        
# #         if not data:
# #             return f"No cold storage found near {city}."
# #         out = f"Cold storage near {city}:\n\n"
# #         for r in data:
# #             out += f"{r['rank']}. {r['name']}\n"
# #             out += f"   {r['location']} | {r['phone']}\n"
# #             if r["rating"]:     out += f"   {r['rating']} ★\n"
# #             if r["trust_seal"]: out += f"   ✓ TrustSEAL\n"
# #             out += "\n"
# #         return out
# #     except Exception as e:
# #         return f"Scraping error: {e}"


# # _TOOLS     = [get_price_prediction, compare_all_markets, get_storage_advice,
# #               get_7day_forecast, get_demand_signal, find_cold_storage]


# # # ══════════════════════════════════════════════════════════════════════════════
# # # LIVE BROWSER STREAMING WITH ACTION LOGS
# # # ══════════════════════════════════════════════════════════════════════════════

# # _browser_sessions: dict[str, dict] = {}  # sid -> {queue: asyncio.Queue, actions: list}


# # # <-- FIXED SCRAPER: Takes sid as parameter
# # async def _scrape_with_live_feed(city: str, sid: str) -> list[dict]:
# #     """
# #     Scrape IndiaMART with LIVE streaming of browser actions and screenshots.
# #     This creates that Grok-style 'watch the agent work' experience.
# #     """
# #     queue = asyncio.Queue()
# #     actions = []
# #     _browser_sessions[sid] = {"queue": queue, "actions": actions}
    
# #     # <-- ADDED: Wait for frontend WebSocket to connect before starting
# #     await asyncio.sleep(1.5)
    
# #     results = []
    
# #     async def send_frame(page, action: str = None, detail: str = None):
# #         """Capture screenshot and queue it with optional action info"""
# #         png = await page.screenshot(type="png", full_page=False)
# #         frame_data = {
# #             "frame": base64.b64encode(png).decode(),
# #             "action": action,
# #             "detail": detail,
# #             "timestamp": asyncio.get_event_loop().time()
# #         }
# #         await queue.put(frame_data)
# #         if action:
# #             actions.append({"action": action, "detail": detail})
    
# #     async with async_playwright() as p:
# #         # Launch browser - headless but with viewport for screenshots
# #         browser = await p.chromium.launch(
# #             headless=True,  # Keep headless for server, but screenshots show everything
# #             args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
# #         )
        
# #         context = await browser.new_context(
# #             user_agent=(
# #                 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
# #                 "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
# #             ),
# #             viewport={"width": 1280, "height": 900},
# #             device_scale_factor=1
# #         )
        
# #         page = await context.new_page()
        
# #         # ═══════════════════════════════════════════════════════════════════
# #         # STEP 1: Navigate to IndiaMART
# #         # ═══════════════════════════════════════════════════════════════════
# #         await send_frame(page, "navigate", "Opening IndiaMART cold storage page...")
        
# #         await page.goto(
# #             "https://dir.indiamart.com/impcat/vegetable-cold-storage.html",
# #             wait_until="domcontentloaded",
# #             timeout=30000
# #         )
# #         await page.wait_for_timeout(1500)
# #         await send_frame(page, "loaded", "Page loaded successfully")
        
# #         # ═══════════════════════════════════════════════════════════════════
# #         # STEP 2: Close any popup
# #         # ═══════════════════════════════════════════════════════════════════
# #         try:
# #             await send_frame(page, "action", "Looking for popup to close...")
# #             close_btn = await page.wait_for_selector(".close-btn", timeout=4000)
# #             if close_btn:
# #                 await close_btn.click()
# #                 await page.wait_for_timeout(500)
# #                 await send_frame(page, "clicked", "Closed popup dialog")
# #         except Exception:
# #             await send_frame(page, "info", "No popup found, continuing...")
        
# #         # ═══════════════════════════════════════════════════════════════════
# #         # STEP 3: Find and click the city input
# #         # ═══════════════════════════════════════════════════════════════════
# #         await send_frame(page, "action", f"Searching for city input field...")
        
# #         try:
# #             # Try multiple selectors for the city input
# #             city_input = None
# #             selectors = [
# #                 'input[placeholder*="City" i]',
# #                 'input[placeholder*="city" i]',
# #                 'input[placeholder*="location" i]',
# #                 'input[name*="city" i]',
# #                 'input[id*="city" i]',
# #                 '.city-input input',
# #                 '[data-testid*="city"] input'
# #             ]
            
# #             for selector in selectors:
# #                 try:
# #                     city_input = await page.wait_for_selector(selector, timeout=2000)
# #                     if city_input:
# #                         await send_frame(page, "found", f"Found city input: {selector}")
# #                         break
# #                 except:
# #                     continue
            
# #             if not city_input:
# #                 # Try to find any input that might be for location
# #                 city_input = await page.query_selector('input[type="text"]')
# #                 if city_input:
# #                     await send_frame(page, "found", "Using first text input as city field")
            
# #             if city_input:
# #                 await city_input.click()
# #                 await send_frame(page, "clicked", "Clicked on city input field")
# #                 await page.wait_for_timeout(300)
                
# #                 # Clear and type city name
# #                 await city_input.fill("")
# #                 await send_frame(page, "typing", f"Typing '{city}'...")
                
# #                 # Type character by character for visual effect
# #                 for char in city:
# #                     await city_input.type(char, delay=50)
# #                     if ord(char) % 2 == 0:  # Capture every other char for performance
# #                         await send_frame(page, "typing", f"Typing '{city}'... ({char})")
                
# #                 await page.wait_for_timeout(1000)
# #                 await send_frame(page, "typed", f"City name '{city}' entered")
                
# #                 # ═══════════════════════════════════════════════════════════
# #                 # STEP 4: Select from dropdown
# #                 # ═══════════════════════════════════════════════════════════
# #                 await send_frame(page, "action", "Waiting for dropdown suggestions...")
# #                 await page.wait_for_timeout(1500)
                
# #                 # Try to find and click dropdown option
# #                 dropdown_selectors = [
# #                     '.suggestion-item',
# #                     '.dropdown-item',
# #                     '[role="option"]',
# #                     '.autocomplete-item',
# #                     'li[class*="suggest"]'
# #                 ]
                
# #                 dropdown_clicked = False
# #                 for selector in dropdown_selectors:
# #                     try:
# #                         option = await page.wait_for_selector(selector, timeout=2000)
# #                         if option:
# #                             await option.click()
# #                             dropdown_clicked = True
# #                             await send_frame(page, "selected", f"Selected from dropdown: {selector}")
# #                             break
# #                     except:
# #                         continue
                
# #                 if not dropdown_clicked:
# #                     # Press Enter as fallback
# #                     await city_input.press("Enter")
# #                     await send_frame(page, "submitted", "Pressed Enter to search")
                
# #                 await page.wait_for_timeout(3000)
# #                 await send_frame(page, "searched", f"Search results for '{city}' loaded")
                
# #         except Exception as e:
# #             await send_frame(page, "error", f"City input error: {str(e)[:50]}")
        
# #         # ═══════════════════════════════════════════════════════════════════
# #         # STEP 5: Close any popup again
# #         # ═══════════════════════════════════════════════════════════════════
# #         try:
# #             close_btn = await page.wait_for_selector(".close-btn", timeout=2000)
# #             if close_btn:
# #                 await close_btn.click()
# #                 await send_frame(page, "clicked", "Closed secondary popup")
# #         except:
# #             pass
        
# #         # ═══════════════════════════════════════════════════════════════════
# #         # STEP 6: Wait for and extract results
# #         # ═══════════════════════════════════════════════════════════════════
# #         await send_frame(page, "action", "Waiting for supplier cards to load...")
        
# #         card_selectors = [
# #             ".supplierInfoDiv",
# #             ".supplier-card",
# #             "[data-testid='supplier-card']",
# #             ".card.supplier"
# #         ]
        
# #         cards = None
# #         for selector in card_selectors:
# #             try:
# #                 await page.wait_for_selector(selector, timeout=5000)
# #                 cards = page.locator(selector)
# #                 count = await cards.count()
# #                 if count > 0:
# #                     await send_frame(page, "found", f"Found {count} supplier cards")
# #                     break
# #             except:
# #                 continue
        
# #         if cards:
# #             total = await cards.count()
# #             await send_frame(page, "extracting", f"Extracting data from {min(total, 8)} suppliers...")
            
# #             for i in range(min(total, 8)):
# #                 try:
# #                     card = cards.nth(i)
                    
# #                     # Scroll card into view for screenshot
# #                     await card.scroll_into_view_if_needed()
# #                     if i % 2 == 0:
# #                         await send_frame(page, "scrolling", f"Processing supplier {i+1}/{min(total, 8)}...")
                    
# #                     # Extract data
# #                     name = ""
# #                     try:
# #                         name_elem = await card.locator(".companyname a, .company-name, h3, .title").first.inner_text(timeout=1000)
# #                         name = name_elem.strip()
# #                     except:
# #                         name = f"Supplier {i+1}"
                    
# #                     loc = ""
# #                     try:
# #                         loc_elem = await card.locator(".newLocationUi .highlight, .location, .address").first.inner_text(timeout=1000)
# #                         loc = loc_elem.strip()
# #                     except:
# #                         pass
                    
# #                     rating = ""
# #                     try:
# #                         rating_elem = await card.locator(".bo.color, .rating, .stars").first.inner_text(timeout=1000)
# #                         rating = rating_elem.strip()
# #                     except:
# #                         pass
                    
# #                     trust = False
# #                     try:
# #                         trust_text = await card.locator(".lh11.cp.fs10, .trust-badge").first.inner_text(timeout=1000)
# #                         trust = "TrustSEAL" in trust_text
# #                     except:
# #                         pass
                    
# #                     phone = "N/A"
# #                     try:
# #                         phone_elem = await card.locator(".pns_h, .phone, .contact").first.inner_text(timeout=1500)
# #                         phone_text = phone_elem.strip()
# #                         hits = _re.findall(r'\d{10}', phone_text.replace(" ", ""))
# #                         phone = hits[0] if hits else phone_text[:20]
# #                     except:
# #                         pass
                    
# #                     if name:
# #                         results.append({
# #                             "rank": i+1,
# #                             "name": name,
# #                             "location": loc,
# #                             "phone": phone,
# #                             "rating": rating,
# #                             "trust_seal": trust
# #                         })
                        
# #                 except Exception as e:
# #                     continue
            
# #             await send_frame(page, "complete", f"Extracted {len(results)} suppliers successfully")
# #         else:
# #             await send_frame(page, "error", "No supplier cards found on page")
        
# #         await browser.close()
    
# #     # Send completion signal
# #     await queue.put({"done": True, "results_count": len(results)})
    
# #     # Clean up session after a delay
# #     async def cleanup():
# #         await asyncio.sleep(60)
# #         _browser_sessions.pop(sid, None)
    
# #     asyncio.create_task(cleanup())
    
# #     return results


# # # ══════════════════════════════════════════════════════════════════════════════
# # # LLM + GRAPH
# # # ══════════════════════════════════════════════════════════════════════════════

# # _llm            = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY, temperature=0.2)
# # _llm_with_tools = _llm.bind_tools(_TOOLS)

# # _SYSTEM = """You are OrangeBot — AI assistant for orange farmers in Nagpur, India.
# # Tools: price prediction, market comparison, storage advice, cold storage search.

# # Rules:
# # - Always call tools before giving price/market advice
# # - ONE clear final recommendation
# # - Concise. Understand Hinglish.

# # Flow when farmer gives quantity + location:
# # 1. get_demand_signal → 2. get_storage_advice → 3. compare_all_markets → 4. summarise

# # If info missing → ask human. Prefix with: [HUMAN_INPUT_NEEDED]:"""


# # def _llm_node(state: AgentState) -> AgentState:
# #     msgs     = [SystemMessage(content=_SYSTEM)] + state["messages"]
# #     response = _llm_with_tools.invoke(msgs)
# #     return {"messages": [response], "awaiting_human": False}


# # def _route(state: AgentState) -> str:
# #     last    = state["messages"][-1]
# #     content = getattr(last, "content", "")
# #     if hasattr(last, "tool_calls") and last.tool_calls:  return "tools"
# #     if "[HUMAN_INPUT_NEEDED]" in content:                return "human_pause"
# #     return END


# # def _human_pause_node(state: AgentState) -> AgentState:
# #     return {"awaiting_human": True}


# # _memory    = MemorySaver()
# # _tool_node = ToolNode(_TOOLS)
# # _graph     = StateGraph(AgentState)
# # _graph.add_node("llm",         _llm_node)
# # _graph.add_node("tools",       _tool_node)
# # _graph.add_node("human_pause", _human_pause_node)
# # _graph.set_entry_point("llm")
# # _graph.add_conditional_edges("llm", _route,
# #                               {"tools": "tools", "human_pause": "human_pause", END: END})
# # _graph.add_edge("tools", "llm")
# # _graph.add_edge("human_pause", END)
# # _agent = _graph.compile(checkpointer=_memory, interrupt_before=["human_pause"])


# # # ══════════════════════════════════════════════════════════════════════════════
# # # SSE STREAMING HELPER
# # # ══════════════════════════════════════════════════════════════════════════════

# # def _sse(obj: dict) -> str:
# #     return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


# # async def _stream_agent(messages: list, session_id: str) -> AsyncGenerator[str, None]:
# #     config = {"configurable": {"thread_id": session_id}}
# #     seen_ids: set = set()
    
# #     async for chunk in _agent.astream(
# #         {"messages": messages},
# #         config=config,
# #         stream_mode="values",
# #     ):
# #         msgs = chunk.get("messages", [])
# #         for msg in msgs:
# #             mid = id(msg)
# #             if mid in seen_ids:
# #                 continue
# #             seen_ids.add(mid)
            
# #             # AI message with tool calls
# #             if hasattr(msg, "tool_calls") and msg.tool_calls:
# #                 for tc in msg.tool_calls:
# #                     yield _sse({"type": "tool_call", "name": tc["name"], "input": tc["args"]})
                    
# #                     # If it's cold storage → tell frontend to open browser WS
# #                     if tc["name"] == "find_cold_storage":
# #                         city = tc["args"].get("city", "Nagpur")
# #                         yield _sse({
# #                             "type": "browser_start",
# #                             "session_id": session_id,
# #                             "city": city
# #                         })
            
# #             # Tool result
# #             elif isinstance(msg, ToolMessage):
# #                 yield _sse({
# #                     "type": "tool_result",
# #                     "name": msg.name,
# #                     "output": msg.content[:500]  # slightly longer for more info
# #                 })
            
# #             # AI final text
# #             elif hasattr(msg, "content") and msg.content:
# #                 content = msg.content
# #                 waiting = "[HUMAN_INPUT_NEEDED]" in content
# #                 clean   = content.replace("[HUMAN_INPUT_NEEDED]:", "").strip()
# #                 if waiting:
# #                     yield _sse({"type": "human_input_needed", "question": clean})
# #                 else:
# #                     # Stream word by word
# #                     words = clean.split(" ")
# #                     for i, word in enumerate(words):
# #                         chunk_text = word + (" " if i < len(words) - 1 else "")
# #                         yield _sse({"type": "answer", "text": chunk_text})
# #                         await asyncio.sleep(0.025)
    
# #     yield _sse({"type": "done", "session_id": session_id})


# # # ══════════════════════════════════════════════════════════════════════════════
# # # FASTAPI ROUTES
# # # ══════════════════════════════════════════════════════════════════════════════

# # agent_router = APIRouter(tags=["OrangeBot Agent"])


# # class AgentChatRequest(BaseModel):
# #     message:    str
# #     session_id: str = None


# # class AgentResumeRequest(BaseModel):
# #     session_id:  str
# #     human_input: str


# # @agent_router.get("/agent/stream")
# # async def agent_stream(
# #     message:    str = Query(...),
# #     session_id: str = Query(default=None),
# # ):
# #     """
# #     SSE endpoint. Frontend connects with EventSource.
# #     Streams tool calls, tool results, and final answer word-by-word.
# #     """
# #     sid = session_id or str(uuid.uuid4())
# #     return StreamingResponse(
# #         _stream_agent([HumanMessage(content=message)], sid),
# #         media_type="text/event-stream",
# #         headers={
# #             "Cache-Control": "no-cache",
# #             "X-Accel-Buffering": "no",
# #             "Access-Control-Allow-Origin": "*",
# #         }
# #     )


# # @agent_router.post("/agent/resume")
# # async def agent_resume(req: AgentResumeRequest):
# #     """Resume after human_input_needed. Returns SSE stream."""
# #     return StreamingResponse(
# #         _stream_agent([HumanMessage(content=req.human_input)], req.session_id),
# #         media_type="text/event-stream",
# #         headers={
# #             "Cache-Control": "no-cache",
# #             "X-Accel-Buffering": "no",
# #             "Access-Control-Allow-Origin": "*"
# #         }
# #     )


# # @agent_router.websocket("/agent/browser/{session_id}")
# # async def browser_ws(websocket: WebSocket, session_id: str):
# #     """
# #     WebSocket endpoint for LIVE browser streaming.
    
# #     Sends JSON objects:
# #       { "frame": "<base64_png>", "action": "...", "detail": "..." }
# #       { "done": true, "results_count": N }
    
# #     Frontend displays frame in <img> and shows action log.
# #     """
# #     await websocket.accept()
    
# #     try:
# #         # Wait for session to be created (with timeout)
# #         for _ in range(100):  # 10 seconds
# #             if session_id in _browser_sessions:
# #                 break
# #             await asyncio.sleep(0.1)
        
# #         session = _browser_sessions.get(session_id)
# #         if not session:
# #             await websocket.send_json({"error": "Browser session not found or expired"})
# #             await websocket.close()
# #             return
        
# #         queue = session["queue"]
# #         sent_actions = set()
        
# #         while True:
# #             data = await queue.get()
            
# #             if data is None:
# #                 continue
                
# #             if data.get("done"):
# #                 await websocket.send_json(data)
# #                 break
            
# #             # Send the frame data
# #             await websocket.send_json(data)
            
# #     except WebSocketDisconnect:
# #         pass
# #     except Exception as e:
# #         try:
# #             await websocket.send_json({"error": str(e)})
# #         except:
# #             pass
# #     finally:
# #         try:
# #             await websocket.close()
# #         except:
# #             pass


# # @agent_router.get("/agent/history/{session_id}")
# # def agent_history(session_id: str):
# #     config = {"configurable": {"thread_id": session_id}}
# #     try:
# #         state = _agent.get_state(config)
# #         msgs  = state.values.get("messages", [])
# #         return {
# #             "session_id": session_id,
# #             "messages": [
# #                 {"role": "human" if isinstance(m, HumanMessage) else "ai",
# #                  "content": m.content}
# #                 for m in msgs if hasattr(m, "content") and m.content
# #             ]
# #         }
# #     except Exception as e:
# #         raise HTTPException(404, str(e))


# """
# Orange Chain — Streaming Agent + Live Browser Feed
# Enhanced with Grok-style real-time browser visibility

# New endpoints:
#   GET  /agent/stream        → SSE stream (tool calls + thinking + final answer)
#   WS   /agent/browser/{sid} → WebSocket: live browser screenshots + action logs
#   POST /agent/resume        → resume after human_input_needed
#   GET  /agent/history/{sid} → message history

# SSE event types sent to frontend:
#   { type: "tool_call",   name: "...", input: {...} }
#   { type: "tool_result", name: "...", output: "..." }
#   { type: "thinking",    text: "..." }
#   { type: "answer",      text: "..." }
#   { type: "human_input_needed", question: "..." }
#   { type: "browser_start", session_id: "...", city: "..." }
#   { type: "browser_action", action: "...", detail: "..." }
#   { type: "done" }
# """

# import uuid, asyncio, re as _re, json, base64, os
# from typing import Annotated, Optional, AsyncGenerator
# from typing_extensions import TypedDict

# from dotenv import load_dotenv
# load_dotenv()

# from langchain_groq import ChatGroq
# from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
# from langchain_core.tools import tool
# from langchain_core.runnables import RunnableConfig
# from langgraph.graph import StateGraph, END
# from langgraph.graph.message import add_messages
# from langgraph.prebuilt import ToolNode
# from langgraph.checkpoint.memory import MemorySaver

# from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query
# from fastapi.responses import StreamingResponse
# from pydantic import BaseModel
# import requests as _http
# from playwright.async_api import async_playwright, Page as _Page

# GROQ_API_KEY = os.getenv("GROQ_API")
# _API_BASE    = "http://127.0.0.1:8000"


# class AgentState(TypedDict):
#     messages:       Annotated[list, add_messages]
#     awaiting_human: Optional[bool]


# # ══════════════════════════════════════════════════════════════════════════════
# # TOOLS
# # ══════════════════════════════════════════════════════════════════════════════

# @tool
# def get_price_prediction(market: str, date: str = None) -> str:
#     """Price prediction + demand signal + recommendation. market e.g. 'Nagpur APMC'. date optional YYYY-MM-DD."""
#     try:
#         params = {"market": market}
#         if date: params["date"] = date
#         d = _http.get(f"{_API_BASE}/predict", params=params, timeout=5).json()
#         return (
#             f"Market: {d['market']}\n"
#             f"Predicted: ₹{d['predicted_prices']['modal_price']}/quintal\n"
#             f"Net after transport: ₹{d['net_price']}/quintal\n"
#             f"Signal: {d['demand_signal']['signal']} — {d['demand_signal']['pressure']}\n"
#             f"Advice: {d['demand_signal']['advice']}\n"
#             f"Recommendation: {d['recommendation']}"
#         )
#     except Exception as e:
#         return f"Error: {e}"


# @tool
# def compare_all_markets(date: str = None) -> str:
#     """All markets ranked by net profit after transport. Best mandi to sell today."""
#     try:
#         d    = _http.get(f"{_API_BASE}/compare-markets", params={"date": date} if date else {}, timeout=10).json()
#         top3 = d['all_markets'][:3]
#         out  = f"Best: {d['summary']}\n\nTop 3:\n"
#         for i, m in enumerate(top3, 1):
#             out += f"{i}. {m['market']} — ₹{m['net_price']}/quintal (signal: {m['signal']})\n"
#         return out
#     except Exception as e:
#         return f"Error: {e}"


# @tool
# def get_storage_advice(market: str, quantity: float, days: int = 28) -> str:
#     """Sell now or store? market, quantity in quintals, days window."""
#     try:
#         d = _http.get(f"{_API_BASE}/storage-optimizer",
#                       params={"market": market, "quantity": quantity, "days": days}, timeout=5).json()
#         return (
#             f"Current price: ₹{d['current_price']}/quintal\n"
#             f"Sell now: ₹{d['sell_now_revenue']}\n"
#             f"Optimal: hold {d['optimal_day']} days → extra ₹{d['optimal_net_gain']}/quintal\n"
#             f"Advice: {d['advice']}"
#         )
#     except Exception as e:
#         return f"Error: {e}"


# @tool
# def get_7day_forecast(market: str) -> str:
#     """7-day price forecast with trend."""
#     try:
#         d   = _http.get(f"{_API_BASE}/forecast", params={"market": market, "days": 7}, timeout=5).json()
#         out = f"Forecast {market} (trend: {d['trend']}):\n"
#         for e in d['forecast']:
#             out += f"  Day {e['day']} ({e['date']}): ₹{e['modal_price']}/quintal\n"
#         return out
#     except Exception as e:
#         return f"Error: {e}"


# @tool
# def get_demand_signal(market: str) -> str:
#     """Demand pressure — OVERSUPPLY / UNDERSUPPLY / BALANCED."""
#     try:
#         d = _http.get(f"{_API_BASE}/demand-signal", params={"market": market}, timeout=5).json()
#         return (
#             f"Signal: {d['signal']} — {d['pressure']}\n"
#             f"Vol ratio: {d['vol_ratio']} | Momentum: ₹{d['price_momentum']}\n"
#             f"Advice: {d['advice']}"
#         )
#     except Exception as e:
#         return f"Error: {e}"


# @tool
# async def find_cold_storage(city: str, config: RunnableConfig) -> str:
#     """
#     Search IndiaMART for cold storage near a city. Opens live browser (visible on webpage).
#     city: e.g. 'Nagpur', 'Amravati', 'Pune'
#     """
#     try:
#         # Extract the exact session ID from the chat thread
#         sid = config.get("configurable", {}).get("thread_id", str(uuid.uuid4()))
        
#         # Await it directly, passing down the SID
#         data = await _scrape_with_live_feed(city, sid)
        
#         if not data:
#             return f"No cold storage found near {city}."
#         out = f"Cold storage near {city}:\n\n"
#         for r in data:
#             out += f"{r['rank']}. {r['name']}\n"
#             out += f"   {r['location']} | {r['phone']}\n"
#             if r["rating"]:     out += f"   {r['rating']} ★\n"
#             if r["trust_seal"]: out += f"   ✓ TrustSEAL\n"
#             out += "\n"
#         return out
#     except Exception as e:
#         return f"Scraping error: {e}"


# _TOOLS     = [get_price_prediction, compare_all_markets, get_storage_advice,
#               get_7day_forecast, get_demand_signal, find_cold_storage]


# # ══════════════════════════════════════════════════════════════════════════════
# # LIVE BROWSER STREAMING WITH ACTION LOGS
# # ══════════════════════════════════════════════════════════════════════════════

# _browser_sessions: dict[str, dict] = {}  # sid -> {queue: asyncio.Queue, actions: list}


# async def _scrape_with_live_feed(city: str, sid: str) -> list[dict]:
#     """
#     Scrape IndiaMART with LIVE streaming of browser actions and screenshots.
#     Using the Main Homepage Search strategy for better reliability.
#     """
#     queue = asyncio.Queue()
#     actions = []
#     _browser_sessions[sid] = {"queue": queue, "actions": actions}
    
#     # Wait for frontend WebSocket to connect
#     await asyncio.sleep(1.5)
    
#     results = []
    
#     async def send_frame(page, action: str = None, detail: str = None):
#         """Capture screenshot and queue it safely"""
#         try:
#             png = await page.screenshot(type="png", full_page=False)
#             frame_data = {
#                 "frame": base64.b64encode(png).decode(),
#                 "action": action,
#                 "detail": detail,
#                 "timestamp": asyncio.get_event_loop().time()
#             }
#             await queue.put(frame_data)
#             if action:
#                 actions.append({"action": action, "detail": detail})
#         except Exception:
#             pass # Ignore screenshot errors if page is navigating
    
#     async with async_playwright() as p:
#         browser = await p.chromium.launch(
#             headless=True,
#             args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
#         )
        
#         context = await browser.new_context(
#             user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
#             viewport={"width": 1280, "height": 900},
#             device_scale_factor=1
#         )
        
#         page = await context.new_page()
        
#         # ═══════════════════════════════════════════════════════════════════
#         # STEP 1: Navigate to IndiaMART Home Page
#         # ═══════════════════════════════════════════════════════════════════
#         await send_frame(page, "navigate", "Opening IndiaMART Homepage...")
#         await page.goto("https://dir.indiamart.com/", wait_until="domcontentloaded", timeout=30000)
#         await page.wait_for_timeout(2000)
        
#         # ═══════════════════════════════════════════════════════════════════
#         # STEP 2: Force Close Popups
#         # ═══════════════════════════════════════════════════════════════════
#         try:
#             await send_frame(page, "action", "Clearing popups...")
#             close_btn = await page.wait_for_selector(".close-btn, #no-thanks, .ui-dialog-titlebar-close", timeout=3000)
#             if close_btn:
#                 await close_btn.click(force=True)  # force=True bypasses invisible blockers
#                 await page.wait_for_timeout(500)
#                 await send_frame(page, "clicked", "Closed popup dialog")
#         except:
#             pass
            
#         # ═══════════════════════════════════════════════════════════════════
#         # STEP 3: Main Search Box
#         # ═══════════════════════════════════════════════════════════════════
#         await send_frame(page, "action", "Locating main search bar...")
#         search_input = None
        
#         # Look for the big search bar
#         for sel in ['#search_string', 'input[name="ss"]', 'input[placeholder*="Search" i]']:
#             try:
#                 search_input = await page.wait_for_selector(sel, timeout=3000, state="visible")
#                 if search_input: break
#             except: continue
            
#         if search_input:
#             # force=True guarantees the click happens
#             await search_input.click(force=True)
#             await search_input.fill("")
            
#             query = f"vegetable cold storage in {city}"
#             await send_frame(page, "typing", f"Typing '{query}'...")
            
#             for char in query:
#                 await search_input.type(char, delay=50)
#                 if ord(char) % 2 == 0:
#                     await send_frame(page, "typing", f"Typing '{query}'... ({char})")
                    
#             await page.wait_for_timeout(500)
#             await search_input.press("Enter")
#             await send_frame(page, "submitted", "Searching...")
            
#             # Wait for search results to load
#             await page.wait_for_timeout(4000)
            
#         # ═══════════════════════════════════════════════════════════════════
#         # STEP 4: Bulletproof Extraction
#         # ═══════════════════════════════════════════════════════════════════
#         await send_frame(page, "action", "Waiting for supplier cards to load...")
        
#         # IndiaMART uses different classes for search results vs category pages
#         card_selectors = [
#             ".lst_cl", ".fw.p7.bg1", "section.lst_sec", 
#             ".supplierInfoDiv", ".supplier-card", ".card.supplier",
#             "li[id^='LST']"
#         ]
        
#         cards = None
#         for selector in card_selectors:
#             try:
#                 await page.wait_for_selector(selector, timeout=5000)
#                 cards = page.locator(selector)
#                 if await cards.count() > 0:
#                     await send_frame(page, "found", f"Found supplier cards!")
#                     break
#             except:
#                 continue
                
#         if cards:
#             total = await cards.count()
#             for i in range(min(total, 5)):
#                 try:
#                     card = cards.nth(i)
#                     await card.scroll_into_view_if_needed()
#                     if i % 2 == 0:
#                         await send_frame(page, "scrolling", f"Processing supplier {i+1}...")
                        
#                     # Extremely resilient text extraction
#                     text_content = await card.inner_text()
#                     lines = [line.strip() for line in text_content.split('\n') if line.strip()]
                    
#                     if len(lines) > 0:
#                         name = lines[0]
#                         loc = lines[1] if len(lines) > 1 else city
                        
#                         # Find the first 10 digit number for phone
#                         phone = "N/A"
#                         phone_match = _re.search(r'\d{10}', text_content.replace(" ", ""))
#                         if phone_match:
#                             phone = phone_match.group(0)
                            
#                         results.append({
#                             "rank": i+1,
#                             "name": name[:50],
#                             "location": loc[:50],
#                             "phone": phone,
#                             "rating": "★" if "★" in text_content else "",
#                             "trust_seal": "TrustSEAL" in text_content or "Verified" in text_content
#                         })
#                 except Exception:
#                     continue
                    
#             await send_frame(page, "complete", f"Extracted {len(results)} suppliers")
#         else:
#             await send_frame(page, "error", "No supplier cards found on page")
        
#         await browser.close()
        
#     # Send completion signal
#     await queue.put({"done": True, "results_count": len(results)})
    
#     # Clean up session
#     async def cleanup():
#         await asyncio.sleep(60)
#         _browser_sessions.pop(sid, None)
    
#     asyncio.create_task(cleanup())
    
#     return results


# # ══════════════════════════════════════════════════════════════════════════════
# # LLM + GRAPH
# # ══════════════════════════════════════════════════════════════════════════════

# _llm            = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY, temperature=0.2)
# _llm_with_tools = _llm.bind_tools(_TOOLS)
# _SYSTEM = """You are OrangeBot — AI assistant for orange farmers in Nagpur, India.
# Tools: price prediction, market comparison, storage advice, cold storage search.

# CRITICAL RULES:
# 1. SEQUENTIAL THINKING: Do NOT call tools in parallel if they depend on each other. If the farmer wants cold storage in the "best" market, you MUST call `compare_all_markets` FIRST. Wait for the result. THEN call `find_cold_storage` with the winning city.
# 2. ERROR HANDLING: If any tool returns an "Error", ignore it, do not panic, and continue answering using the other successful data.
# 3. MANDATORY SUMMARY: After all tools have finished, you MUST provide a final text recommendation to the farmer in clear Hinglish/English. Summarize the best market, profits, and the cold storage options found.

# Flow when farmer gives quantity + location:
# 1. get_demand_signal → 2. compare_all_markets → 3. find_cold_storage (in the best market) → 4. Summarise

# If info missing → ask human. Prefix with: [HUMAN_INPUT_NEEDED]:"""


# def _llm_node(state: AgentState) -> AgentState:
#     msgs     = [SystemMessage(content=_SYSTEM)] + state["messages"]
#     response = _llm_with_tools.invoke(msgs)
#     return {"messages": [response], "awaiting_human": False}


# def _route(state: AgentState) -> str:
#     last    = state["messages"][-1]
#     content = getattr(last, "content", "")
#     if hasattr(last, "tool_calls") and last.tool_calls:  return "tools"
#     if "[HUMAN_INPUT_NEEDED]" in content:                return "human_pause"
#     return END


# def _human_pause_node(state: AgentState) -> AgentState:
#     return {"awaiting_human": True}


# _memory    = MemorySaver()
# _tool_node = ToolNode(_TOOLS)
# _graph     = StateGraph(AgentState)
# _graph.add_node("llm",         _llm_node)
# _graph.add_node("tools",       _tool_node)
# _graph.add_node("human_pause", _human_pause_node)
# _graph.set_entry_point("llm")
# _graph.add_conditional_edges("llm", _route,
#                               {"tools": "tools", "human_pause": "human_pause", END: END})
# _graph.add_edge("tools", "llm")
# _graph.add_edge("human_pause", END)
# _agent = _graph.compile(checkpointer=_memory, interrupt_before=["human_pause"])


# # ══════════════════════════════════════════════════════════════════════════════
# # SSE STREAMING HELPER
# # ══════════════════════════════════════════════════════════════════════════════

# def _sse(obj: dict) -> str:
#     return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


# async def _stream_agent(messages: list, session_id: str) -> AsyncGenerator[str, None]:
#     config = {"configurable": {"thread_id": session_id}}
#     seen_ids: set = set()
    
#     async for chunk in _agent.astream(
#         {"messages": messages},
#         config=config,
#         stream_mode="values",
#     ):
#         msgs = chunk.get("messages", [])
#         for msg in msgs:
#             mid = id(msg)
#             if mid in seen_ids:
#                 continue
#             seen_ids.add(mid)
            
#             # AI message with tool calls
#             if hasattr(msg, "tool_calls") and msg.tool_calls:
#                 for tc in msg.tool_calls:
#                     yield _sse({"type": "tool_call", "name": tc["name"], "input": tc["args"]})
                    
#                     # If it's cold storage → tell frontend to open browser WS
#                     if tc["name"] == "find_cold_storage":
#                         city = tc["args"].get("city", "Nagpur")
#                         yield _sse({
#                             "type": "browser_start",
#                             "session_id": session_id,
#                             "city": city
#                         })
            
#             # Tool result
#             elif isinstance(msg, ToolMessage):
#                 yield _sse({
#                     "type": "tool_result",
#                     "name": msg.name,
#                     "output": msg.content[:500]
#                 })
            
#             # AI final text
#             elif isinstance(msg, AIMessage) and hasattr(msg, "content") and msg.content:
#                 content = msg.content
#                 waiting = "[HUMAN_INPUT_NEEDED]" in content
#                 clean   = content.replace("[HUMAN_INPUT_NEEDED]:", "").strip()
#                 if waiting:
#                     yield _sse({"type": "human_input_needed", "question": clean})
#                 else:
#                     # Stream word by word
#                     words = clean.split(" ")
#                     for i, word in enumerate(words):
#                         chunk_text = word + (" " if i < len(words) - 1 else "")
#                         yield _sse({"type": "answer", "text": chunk_text})
#                         await asyncio.sleep(0.025)
    
#     yield _sse({"type": "done", "session_id": session_id})


# # ══════════════════════════════════════════════════════════════════════════════
# # FASTAPI ROUTES
# # ══════════════════════════════════════════════════════════════════════════════

# agent_router = APIRouter(tags=["OrangeBot Agent"])


# class AgentChatRequest(BaseModel):
#     message:    str
#     session_id: str = None


# class AgentResumeRequest(BaseModel):
#     session_id:  str
#     human_input: str


# @agent_router.get("/agent/stream")
# async def agent_stream(
#     message:    str = Query(...),
#     session_id: str = Query(default=None),
# ):
#     """
#     SSE endpoint. Frontend connects with EventSource.
#     Streams tool calls, tool results, and final answer word-by-word.
#     """
#     sid = session_id or str(uuid.uuid4())
#     return StreamingResponse(
#         _stream_agent([HumanMessage(content=message)], sid),
#         media_type="text/event-stream",
#         headers={
#             "Cache-Control": "no-cache",
#             "X-Accel-Buffering": "no",
#             "Access-Control-Allow-Origin": "*",
#         }
#     )


# @agent_router.post("/agent/resume")
# async def agent_resume(req: AgentResumeRequest):
#     """Resume after human_input_needed. Returns SSE stream."""
#     return StreamingResponse(
#         _stream_agent([HumanMessage(content=req.human_input)], req.session_id),
#         media_type="text/event-stream",
#         headers={
#             "Cache-Control": "no-cache",
#             "X-Accel-Buffering": "no",
#             "Access-Control-Allow-Origin": "*"
#         }
#     )


# @agent_router.websocket("/agent/browser/{session_id}")
# async def browser_ws(websocket: WebSocket, session_id: str):
#     """
#     WebSocket endpoint for LIVE browser streaming.
    
#     Sends JSON objects:
#       { "frame": "<base64_png>", "action": "...", "detail": "..." }
#       { "done": true, "results_count": N }
    
#     Frontend displays frame in <img> and shows action log.
#     """
#     await websocket.accept()
    
#     try:
#         # Wait for session to be created (with timeout)
#         for _ in range(100):  # 10 seconds
#             if session_id in _browser_sessions:
#                 break
#             await asyncio.sleep(0.1)
        
#         session = _browser_sessions.get(session_id)
#         if not session:
#             await websocket.send_json({"error": "Browser session not found or expired"})
#             await websocket.close()
#             return
        
#         queue = session["queue"]
#         sent_actions = set()
        
#         while True:
#             data = await queue.get()
            
#             if data is None:
#                 continue
                
#             if data.get("done"):
#                 await websocket.send_json(data)
#                 break
            
#             # Send the frame data
#             await websocket.send_json(data)
            
#     except WebSocketDisconnect:
#         pass
#     except Exception as e:
#         try:
#             await websocket.send_json({"error": str(e)})
#         except:
#             pass
#     finally:
#         try:
#             await websocket.close()
#         except:
#             pass


# @agent_router.get("/agent/history/{session_id}")
# def agent_history(session_id: str):
#     config = {"configurable": {"thread_id": session_id}}
#     try:
#         state = _agent.get_state(config)
#         msgs  = state.values.get("messages", [])
#         return {
#             "session_id": session_id,
#             "messages": [
#                 {"role": "human" if isinstance(m, HumanMessage) else "ai",
#                  "content": m.content}
#                 for m in msgs if hasattr(m, "content") and m.content
#             ]
#         }
#     except Exception as e:
#         raise HTTPException(404, str(e))
"""
Orange Chain — Streaming Agent + Live Browser Feed
Enhanced with Grok-style real-time browser visibility

New endpoints:
  GET  /agent/stream        → SSE stream (tool calls + thinking + final answer)
  WS   /agent/browser/{sid} → WebSocket: live browser screenshots + action logs
  POST /agent/resume        → resume after human_input_needed
  GET  /agent/history/{sid} → message history
"""

import uuid, asyncio, re as _re, json, base64, os
from typing import Annotated, Optional, AsyncGenerator
from typing_extensions import TypedDict

from dotenv import load_dotenv
load_dotenv()

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import requests as _http
from playwright.async_api import async_playwright, Page as _Page

GROQ_API_KEY = os.getenv("GROQ_API")
_API_BASE    = "http://127.0.0.1:8000"


class AgentState(TypedDict):
    messages:       Annotated[list, add_messages]
    awaiting_human: Optional[bool]


# ══════════════════════════════════════════════════════════════════════════════
# TOOLS
# ══════════════════════════════════════════════════════════════════════════════

@tool
def get_price_prediction(market: str, date: str = None) -> str:
    """Price prediction + demand signal + recommendation. market e.g. 'Nagpur APMC'. date optional YYYY-MM-DD."""
    try:
        params = {"market": market}
        if date: params["date"] = date
        d = _http.get(f"{_API_BASE}/predict", params=params, timeout=5).json()
        return (
            f"Market: {d['market']}\n"
            f"Predicted: ₹{d['predicted_prices']['modal_price']}/quintal\n"
            f"Net after transport: ₹{d['net_price']}/quintal\n"
            f"Signal: {d['demand_signal']['signal']} — {d['demand_signal']['pressure']}\n"
            f"Advice: {d['demand_signal']['advice']}\n"
            f"Recommendation: {d['recommendation']}"
        )
    except Exception as e:
        return f"Error: {e}"


@tool
def compare_all_markets(date: str = None) -> str:
    """All markets ranked by net profit after transport. Best mandi to sell today."""
    try:
        d    = _http.get(f"{_API_BASE}/compare-markets", params={"date": date} if date else {}, timeout=10).json()
        top3 = d['all_markets'][:3]
        out  = f"Best: {d['summary']}\n\nTop 3:\n"
        for i, m in enumerate(top3, 1):
            out += f"{i}. {m['market']} — ₹{m['net_price']}/quintal (signal: {m['signal']})\n"
        return out
    except Exception as e:
        return f"Error: {e}"


@tool
def get_storage_advice(market: str, quantity: float, days: int = 28) -> str:
    """Sell now or store? market, quantity in quintals, days window."""
    try:
        d = _http.get(f"{_API_BASE}/storage-optimizer",
                      params={"market": market, "quantity": quantity, "days": days}, timeout=5).json()
        return (
            f"Current price: ₹{d['current_price']}/quintal\n"
            f"Sell now: ₹{d['sell_now_revenue']}\n"
            f"Optimal: hold {d['optimal_day']} days → extra ₹{d['optimal_net_gain']}/quintal\n"
            f"Advice: {d['advice']}"
        )
    except Exception as e:
        return f"Error: {e}"


@tool
def get_7day_forecast(market: str) -> str:
    """7-day price forecast with trend."""
    try:
        d   = _http.get(f"{_API_BASE}/forecast", params={"market": market, "days": 7}, timeout=5).json()
        out = f"Forecast {market} (trend: {d['trend']}):\n"
        for e in d['forecast']:
            out += f"  Day {e['day']} ({e['date']}): ₹{e['modal_price']}/quintal\n"
        return out
    except Exception as e:
        return f"Error: {e}"


@tool
def get_demand_signal(market: str) -> str:
    """Demand pressure — OVERSUPPLY / UNDERSUPPLY / BALANCED."""
    try:
        d = _http.get(f"{_API_BASE}/demand-signal", params={"market": market}, timeout=5).json()
        return (
            f"Signal: {d['signal']} — {d['pressure']}\n"
            f"Vol ratio: {d['vol_ratio']} | Momentum: ₹{d['price_momentum']}\n"
            f"Advice: {d['advice']}"
        )
    except Exception as e:
        return f"Error: {e}"


@tool
async def find_cold_storage(city: str, config: RunnableConfig) -> str:
    """
    Search IndiaMART for cold storage near a city. Opens live browser (visible on webpage).
    city: e.g. 'Nagpur', 'Amravati', 'Pune'
    """
    try:
        # Extract the exact session ID from the chat thread
        sid = config.get("configurable", {}).get("thread_id", str(uuid.uuid4()))
        
        # Await it directly, passing down the SID
        data = await _scrape_with_live_feed(city, sid)
        
        if not data:
            return f"No cold storage found near {city}."
        out = f"Cold storage near {city}:\n\n"
        for r in data:
            out += f"{r['rank']}. {r['name']}\n"
            out += f"   {r['location']} | {r['phone']}\n"
            if r["rating"]:     out += f"   {r['rating']} ★\n"
            if r["trust_seal"]: out += f"   ✓ TrustSEAL\n"
            out += "\n"
        return out
    except Exception as e:
        return f"Scraping error: {e}"


_TOOLS     = [get_price_prediction, compare_all_markets, get_storage_advice,
              get_7day_forecast, get_demand_signal, find_cold_storage]


# ══════════════════════════════════════════════════════════════════════════════
# LIVE BROWSER STREAMING WITH ACTION LOGS
# ══════════════════════════════════════════════════════════════════════════════

_browser_sessions: dict[str, dict] = {}  # sid -> {queue: asyncio.Queue, actions: list}


async def _scrape_with_live_feed(city: str, sid: str) -> list[dict]:
    """
    Scrape IndiaMART with LIVE streaming of browser actions and screenshots.
    Using the Main Homepage Search strategy for better reliability.
    """
    queue = asyncio.Queue()
    actions = []
    _browser_sessions[sid] = {"queue": queue, "actions": actions}
    
    # Wait for frontend WebSocket to connect
    await asyncio.sleep(1.5)
    
    results = []
    
    async def send_frame(page, action: str = None, detail: str = None):
        """Capture screenshot and queue it safely"""
        try:
            png = await page.screenshot(type="png", full_page=False)
            frame_data = {
                "frame": base64.b64encode(png).decode(),
                "action": action,
                "detail": detail,
                "timestamp": asyncio.get_event_loop().time()
            }
            await queue.put(frame_data)
            if action:
                actions.append({"action": action, "detail": detail})
        except Exception:
            pass # Ignore screenshot errors if page is navigating
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        )
        
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            viewport={"width": 1280, "height": 900},
            device_scale_factor=1
        )
        
        page = await context.new_page()
        
        # ═══════════════════════════════════════════════════════════════════
        # STEP 1: Navigate to IndiaMART Home Page
        # ═══════════════════════════════════════════════════════════════════
        await send_frame(page, "navigate", "Opening IndiaMART Homepage...")
        await page.goto("https://dir.indiamart.com/", wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2000)
        
        # ═══════════════════════════════════════════════════════════════════
        # STEP 2: Force Close Popups
        # ═══════════════════════════════════════════════════════════════════
        try:
            await send_frame(page, "action", "Clearing popups...")
            close_btn = await page.wait_for_selector(".close-btn, #no-thanks, .ui-dialog-titlebar-close", timeout=3000)
            if close_btn:
                await close_btn.click(force=True)  # force=True bypasses invisible blockers
                await page.wait_for_timeout(500)
                await send_frame(page, "clicked", "Closed popup dialog")
        except:
            pass
            
        # ═══════════════════════════════════════════════════════════════════
        # STEP 3: Main Search Box
        # ═══════════════════════════════════════════════════════════════════
        await send_frame(page, "action", "Locating main search bar...")
        search_input = None
        
        for sel in ['#search_string', 'input[name="ss"]', 'input[placeholder*="Search" i]']:
            try:
                search_input = await page.wait_for_selector(sel, timeout=3000, state="visible")
                if search_input: break
            except: continue
            
        if search_input:
            await search_input.click(force=True)
            await search_input.fill("")
            
            query = f"vegetable cold storage in {city}"
            await send_frame(page, "typing", f"Typing '{query}'...")
            
            for char in query:
                await search_input.type(char, delay=50)
                if ord(char) % 2 == 0:
                    await send_frame(page, "typing", f"Typing '{query}'... ({char})")
                    
            await page.wait_for_timeout(500)
            await search_input.press("Enter")
            await send_frame(page, "submitted", "Searching...")
            
            await page.wait_for_timeout(4000)
            
        # ═══════════════════════════════════════════════════════════════════
        # STEP 4: Bulletproof Extraction
        # ═══════════════════════════════════════════════════════════════════
        await send_frame(page, "action", "Waiting for supplier cards to load...")
        
        card_selectors = [
            ".lst_cl", ".fw.p7.bg1", "section.lst_sec", 
            ".supplierInfoDiv", ".supplier-card", ".card.supplier",
            "li[id^='LST']"
        ]
        
        cards = None
        for selector in card_selectors:
            try:
                await page.wait_for_selector(selector, timeout=5000)
                cards = page.locator(selector)
                if await cards.count() > 0:
                    await send_frame(page, "found", f"Found supplier cards!")
                    break
            except:
                continue
                
        if cards:
            total = await cards.count()
            for i in range(min(total, 5)):
                try:
                    card = cards.nth(i)
                    await card.scroll_into_view_if_needed()
                    if i % 2 == 0:
                        await send_frame(page, "scrolling", f"Processing supplier {i+1}...")
                        
                    text_content = await card.inner_text()
                    lines = [line.strip() for line in text_content.split('\n') if line.strip()]
                    
                    if len(lines) > 0:
                        name = lines[0]
                        loc = lines[1] if len(lines) > 1 else city
                        
                        phone = "N/A"
                        phone_match = _re.search(r'\d{10}', text_content.replace(" ", ""))
                        if phone_match:
                            phone = phone_match.group(0)
                            
                        results.append({
                            "rank": i+1,
                            "name": name[:50],
                            "location": loc[:50],
                            "phone": phone,
                            "rating": "★" if "★" in text_content else "",
                            "trust_seal": "TrustSEAL" in text_content or "Verified" in text_content
                        })
                except Exception:
                    continue
                    
            await send_frame(page, "complete", f"Extracted {len(results)} suppliers")
        else:
            await send_frame(page, "error", "No supplier cards found on page")
        
        await browser.close()
        
    await queue.put({"done": True, "results_count": len(results)})
    
    async def cleanup():
        await asyncio.sleep(60)
        _browser_sessions.pop(sid, None)
    
    asyncio.create_task(cleanup())
    
    return results


# ══════════════════════════════════════════════════════════════════════════════
# LLM + GRAPH
# ══════════════════════════════════════════════════════════════════════════════

_llm            = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY, temperature=0.2)
_llm_with_tools = _llm.bind_tools(_TOOLS)

_SYSTEM = """You are OrangeBot — AI assistant for orange farmers in Nagpur, India.
Tools: price prediction, market comparison, storage advice, cold storage search.

CRITICAL RULES:
1. SEQUENTIAL THINKING: Do NOT call tools in parallel if they depend on each other. If the farmer wants cold storage in the "best" market, you MUST call `compare_all_markets` FIRST. Wait for the result. THEN call `find_cold_storage` with the winning city.
2. ERROR HANDLING: If any tool returns an "Error", ignore it, do not panic, and continue answering using the other successful data.
3. MANDATORY SUMMARY: After all tools have finished, you MUST provide a final text recommendation to the farmer in clear Hinglish/English. Summarize the best market, profits, and the cold storage options found.

Flow when farmer gives quantity + location:
1. compare_all_markets → 2. find_cold_storage (in the best market) → 3. Summarise

If info missing → ask human. Prefix with: [HUMAN_INPUT_NEEDED]:"""


def _llm_node(state: AgentState) -> AgentState:
    msgs     = [SystemMessage(content=_SYSTEM)] + state["messages"]
    response = _llm_with_tools.invoke(msgs)
    return {"messages": [response], "awaiting_human": False}


def _route(state: AgentState) -> str:
    last    = state["messages"][-1]
    content = getattr(last, "content", "")
    if hasattr(last, "tool_calls") and last.tool_calls:  return "tools"
    if "[HUMAN_INPUT_NEEDED]" in content:                return "human_pause"
    return END


def _human_pause_node(state: AgentState) -> AgentState:
    return {"awaiting_human": True}


_memory    = MemorySaver()
_tool_node = ToolNode(_TOOLS)
_graph     = StateGraph(AgentState)
_graph.add_node("llm",         _llm_node)
_graph.add_node("tools",       _tool_node)
_graph.add_node("human_pause", _human_pause_node)
_graph.set_entry_point("llm")
_graph.add_conditional_edges("llm", _route,
                              {"tools": "tools", "human_pause": "human_pause", END: END})
_graph.add_edge("tools", "llm")
_graph.add_edge("human_pause", END)
_agent = _graph.compile(checkpointer=_memory, interrupt_before=["human_pause"])


# ══════════════════════════════════════════════════════════════════════════════
# SSE STREAMING HELPER
# ══════════════════════════════════════════════════════════════════════════════

def _sse(obj: dict) -> str:
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


async def _stream_agent(messages: list, session_id: str) -> AsyncGenerator[str, None]:
    config = {"configurable": {"thread_id": session_id}}
    seen_ids: set = set()
    
    async for chunk in _agent.astream(
        {"messages": messages},
        config=config,
        stream_mode="values",
    ):
        msgs = chunk.get("messages", [])
        for msg in msgs:
            mid = id(msg)
            if mid in seen_ids:
                continue
            seen_ids.add(mid)
            
            # --- IF IT IS THE AI TALKING ---
            if isinstance(msg, AIMessage):
                
                # 1. Catch Tool Calls
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    for tc in msg.tool_calls:
                        yield _sse({"type": "tool_call", "name": tc["name"], "input": tc["args"]})
                        if tc["name"] == "find_cold_storage":
                            city = tc["args"].get("city", "Nagpur")
                            yield _sse({
                                "type": "browser_start",
                                "session_id": session_id,
                                "city": city
                            })
                
                # 2. Catch Text (Changed to 'if' so it NEVER skips text)
                if hasattr(msg, "content") and isinstance(msg.content, str) and msg.content.strip():
                    content = msg.content
                    waiting = "[HUMAN_INPUT_NEEDED]" in content
                    clean   = content.replace("[HUMAN_INPUT_NEEDED]:", "").strip()
                    
                    if waiting:
                        yield _sse({"type": "human_input_needed", "question": clean})
                    elif clean: # Only stream if there is actual text left
                        words = clean.split(" ")
                        for i, word in enumerate(words):
                            chunk_text = word + (" " if i < len(words) - 1 else "")
                            yield _sse({"type": "answer", "text": chunk_text})
                            await asyncio.sleep(0.025)
            
            # --- IF IT IS A TOOL RETURNING DATA ---
            elif isinstance(msg, ToolMessage):
                yield _sse({
                    "type": "tool_result",
                    "name": msg.name,
                    "output": str(msg.content)[:500]
                })
                
    yield _sse({"type": "done", "session_id": session_id})


# ══════════════════════════════════════════════════════════════════════════════
# FASTAPI ROUTES
# ══════════════════════════════════════════════════════════════════════════════

agent_router = APIRouter(tags=["OrangeBot Agent"])


class AgentChatRequest(BaseModel):
    message:    str
    session_id: str = None


class AgentResumeRequest(BaseModel):
    session_id:  str
    human_input: str


@agent_router.get("/agent/stream")
async def agent_stream(
    message:    str = Query(...),
    session_id: str = Query(default=None),
):
    """
    SSE endpoint. Frontend connects with EventSource.
    Streams tool calls, tool results, and final answer word-by-word.
    """
    sid = session_id or str(uuid.uuid4())
    return StreamingResponse(
        _stream_agent([HumanMessage(content=message)], sid),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )


@agent_router.post("/agent/resume")
async def agent_resume(req: AgentResumeRequest):
    """Resume after human_input_needed. Returns SSE stream."""
    return StreamingResponse(
        _stream_agent([HumanMessage(content=req.human_input)], req.session_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )


@agent_router.websocket("/agent/browser/{session_id}")
async def browser_ws(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for LIVE browser streaming.
    """
    await websocket.accept()
    
    try:
        for _ in range(100):  # 10 seconds timeout waiting for scraper queue
            if session_id in _browser_sessions:
                break
            await asyncio.sleep(0.1)
        
        session = _browser_sessions.get(session_id)
        if not session:
            await websocket.send_json({"error": "Browser session not found or expired"})
            await websocket.close()
            return
        
        queue = session["queue"]
        
        while True:
            data = await queue.get()
            if data is None: continue
            
            if data.get("done"):
                await websocket.send_json(data)
                break
            
            await websocket.send_json(data)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except: pass
    finally:
        try:
            await websocket.close()
        except: pass


@agent_router.get("/agent/history/{session_id}")
def agent_history(session_id: str):
    config = {"configurable": {"thread_id": session_id}}
    try:
        state = _agent.get_state(config)
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

if __name__ == "__main__":
    import uvicorn
    # Mount the router to a FastAPI app for easy local running
    from fastapi import FastAPI
    app = FastAPI()
    app.include_router(agent_router)
    uvicorn.run(app, host="127.0.0.1", port=8000)