import asyncio
from playwright.async_api import async_playwright

async def test_playwright():
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(ignore_https_errors=True)
            page = await context.new_page()
            
            print("Navigating to CTRI advanced search...")
            response = await page.goto("https://ctri.nic.in/Clinicaltrials/advancesearchmain.php", wait_until="networkidle")
            
            print("Status:", response.status)
            html = await page.content()
            print("Page HTML snippet:")
            print(html[:2000]) # Print first 2000 chars to see if it's a captcha, blocked page, or iframe
            
            await browser.close()
    except Exception as e:
        print(f"Error: {e}")

asyncio.run(test_playwright())
