import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:3000
        await page.goto("http://localhost:3000", wait_until="commit", timeout=10000)
        
        # -> Click the 'Start Building' button to open the builder (expected to navigate to /play).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/main/section[1]/div/div/div[1]/div[2]/div/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Click the 'Launch Builder' / builder link (index 26) to open the builder and navigate to the /play builder page.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[3]/div/header/div/div/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Close the privacy/cookie banner if needed, then click the Gen I game option (Red/Blue/Yellow) to open Gen I game selection.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/section/div[2]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/main/div[3]/section[1]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Click the Gen I game option (Red/Blue/Yellow, Kanto) to open that game's builder view so Pokémon can be added to the team.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[3]/div/main/div[3]/section[1]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Close the onboarding/tour modal (click 'Skip tour'), then add Bulbasaur to the team, add Charmander to the team, then open Team Tools to access recommendations.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div/div[2]/div[2]/div[2]/button[1]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/div/div[2]/section/div[3]/div/div[1]/div[1]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/div/div[2]/section/div[3]/div/div[1]/div[2]/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Click the Smart Picks recommendation 'Add to team' button for Starmie to add it into the next open slot (slot 3). After that, verify the team shows 3 Pokémon (the two originals plus the recommended one).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/section[4]/section/div[5]/article[1]/div[2]/button[1]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        # Assert the team slot count shows 3/6 filled
        count_loc = frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/div/div[1]/div[1]/section/div[1]/div[2]/span')
        assert await count_loc.is_visible()
        count_text = await count_loc.inner_text()
        assert '3' in count_text and '/6' in count_text
        
        # Assert the three team members (Bulbasaur, Charmander, Starmie) are present by checking their remove buttons are visible
        assert await frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/div/div[1]/div[1]/section/div[2]/div[1]/button[1]').is_visible()  # Remove Bulbasaur
        assert await frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/div/div[1]/div[1]/section/div[2]/div[2]/button[1]').is_visible()  # Remove Charmander
        assert await frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/div/div[1]/div[1]/section/div[2]/div[3]/button[1]').is_visible()  # Remove Starmie
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    