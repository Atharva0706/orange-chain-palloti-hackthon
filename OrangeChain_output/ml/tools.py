"""
tools.py — All LangChain @tool definitions for OrangeBot
Import into agent.py: from tools import TOOLS
"""

import os
import requests as _http
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from browser import scrape_with_live_feed   # browser.py handles playwright
import asyncio
import uuid
from dotenv import load_dotenv
load_dotenv()

_API = os.getenv("ORANGE_API")


@tool
def get_price_prediction(market: str, date: str = None) -> str:
    """Price prediction + demand signal + recommendation. market e.g. 'Nagpur APMC'. date optional YYYY-MM-DD."""
    try:
        params = {"market": market}
        if date: params["date"] = date
        d = _http.get(f"{_API}/predict", params=params, timeout=5).json()
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
        d    = _http.get(f"{_API}/compare-markets", params={"date": date} if date else {}, timeout=10).json()
        top3 = d['all_markets'][:3]
        out  = f"Best: {d['summary']}\n\nTop 3:\n"
        for i, m in enumerate(top3, 1):
            out += f"{i}. {m['market']} — ₹{m['net_price']}/quintal (signal: {m['signal']})\n"
        return out
    except Exception as e:
        return f"Error: {e}"


@tool
def get_storage_advice(market: str, quantity: float, days: int = 28) -> str:
    """Sell now or store? market: market name, quantity: quintals owned, days: window to analyze."""
    try:
        d = _http.get(f"{_API}/storage-optimizer",
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
    """7-day price forecast with trend direction for a market."""
    try:
        d   = _http.get(f"{_API}/forecast", params={"market": market, "days": 7}, timeout=5).json()
        out = f"Forecast {market} (trend: {d['trend']}):\n"
        for e in d['forecast']:
            out += f"  Day {e['day']} ({e['date']}): ₹{e['modal_price']}/quintal\n"
        return out
    except Exception as e:
        return f"Error: {e}"


@tool
def get_demand_signal(market: str) -> str:
    """Demand pressure — OVERSUPPLY / UNDERSUPPLY / BALANCED for a market."""
    try:
        d = _http.get(f"{_API}/demand-signal", params={"market": market}, timeout=5).json()
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
    Search IndiaMART for cold storage near a city. Streams live browser to webpage.
    city: e.g. 'Nagpur', 'Pune', 'Amravati'
    """
    try:
        
        sid  = config.get("configurable", {}).get("thread_id", str(uuid.uuid4()))
        data = await scrape_with_live_feed(city, sid)
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


TOOLS = [
    get_price_prediction,
    compare_all_markets,
    get_storage_advice,
    get_7day_forecast,
    get_demand_signal,
    find_cold_storage,
]