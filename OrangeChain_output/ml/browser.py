"""
browser.py — Playwright scraper with live screenshot streaming
Called by find_cold_storage tool in tools.py
WebSocket endpoint in agent.py streams frames to frontend
"""

import asyncio
import base64
import re
from playwright.async_api import async_playwright

browser_sessions: dict[str, dict] = {}


async def scrape_with_live_feed(city: str, sid: str) -> list[dict]:
    """
    Scrape IndiaMART cold storage for a city.
    Pushes base64 screenshots + action labels to browser_sessions[sid]['queue'].
    Frontend WebSocket reads from that queue and displays frames live.
    """
    queue   = asyncio.Queue()
    actions = []
    browser_sessions[sid] = {"queue": queue, "actions": actions}

    # Give frontend WS time to connect before first frame arrives
    await asyncio.sleep(1.5)

    results = []

    async def shot(page, action: str = None, detail: str = None):
        """Take screenshot, push to queue with action label"""
        try:
            png  = await page.screenshot(type="png", full_page=False)
            data = {
                "frame":  base64.b64encode(png).decode(),
                "action": action,
                "detail": detail,
            }
            await queue.put(data)
            if action:
                actions.append({"action": action, "detail": detail})
        except Exception:
            pass   
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        context = await browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1280, "height": 900},
        )
        page = await context.new_page()

        # ── Step 1: Open IndiaMART ────────────────────────────────────────
        await shot(page, "navigate", "Opening IndiaMART...")
        await page.goto("https://dir.indiamart.com/", wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2000)
        await shot(page, "loaded", "Page loaded")

        # ── Step 2: Close popup ───────────────────────────────────────────
        try:
            btn = await page.wait_for_selector(
                ".close-btn, #no-thanks, .ui-dialog-titlebar-close", timeout=3000
            )
            if btn:
                await btn.click(force=True)
                await page.wait_for_timeout(500)
                await shot(page, "clicked", "Closed popup")
        except Exception:
            pass

        # ── Step 3: Search ────────────────────────────────────────────────
        await shot(page, "action", "Finding search bar...")
        search = None
        for sel in ['#search_string', 'input[name="ss"]', 'input[placeholder*="Search" i]']:
            try:
                search = await page.wait_for_selector(sel, timeout=3000, state="visible")
                if search:
                    break
            except Exception:
                continue

        if search:
            await search.click(force=True)
            await search.fill("")
            query = f"vegetable cold storage in {city}"
            await shot(page, "typing", f"Typing '{query}'...")
            for char in query:
                await search.type(char, delay=45)
                if ord(char) % 3 == 0:   # screenshot every ~3rd char
                    await shot(page, "typing", f"...{char}")
            await page.wait_for_timeout(500)
            await search.press("Enter")
            await shot(page, "submitted", "Searching IndiaMART...")
            await page.wait_for_timeout(4000)
            await shot(page, "results", "Results page loaded")

        # ── Step 4: Extract cards ─────────────────────────────────────────
        await shot(page, "action", "Looking for supplier cards...")
        cards = None
        for sel in [
            ".lst_cl", ".fw.p7.bg1", "section.lst_sec",
            ".supplierInfoDiv", "li[id^='LST']"
        ]:
            try:
                await page.wait_for_selector(sel, timeout=5000)
                loc   = page.locator(sel)
                count = await loc.count()
                if count > 0:
                    cards = loc
                    await shot(page, "found", f"Found {count} supplier cards")
                    break
            except Exception:
                continue

        if cards:
            total = await cards.count()
            for i in range(min(total, 5)):
                try:
                    card = cards.nth(i)
                    await card.scroll_into_view_if_needed()
                    if i % 2 == 0:
                        await shot(page, "scrolling", f"Processing supplier {i+1}/{min(total,5)}...")

                    text  = await card.inner_text()
                    lines = [l.strip() for l in text.split("\n") if l.strip()]
                    if not lines:
                        continue

                    name  = lines[0][:50]
                    loc   = lines[1][:50] if len(lines) > 1 else city
                    phone = "N/A"
                    hit   = re.search(r'\d{10}', text.replace(" ", ""))
                    if hit:
                        phone = hit.group(0)

                    results.append({
                        "rank":       i + 1,
                        "name":       name,
                        "location":   loc,
                        "phone":      phone,
                        "rating":     "★" if "★" in text else "",
                        "trust_seal": "TrustSEAL" in text or "Verified" in text,
                    })
                except Exception:
                    continue

            await shot(page, "complete", f"Extracted {len(results)} suppliers ✓")
        else:
            await shot(page, "error", "No supplier cards found")

        await browser.close()

    # sentinel → tells WS endpoint we're done
    await queue.put({"done": True, "results_count": len(results)})

    # auto-cleanup after 60s
    async def _cleanup():
        await asyncio.sleep(60)
        browser_sessions.pop(sid, None)
    asyncio.create_task(_cleanup())

    return results