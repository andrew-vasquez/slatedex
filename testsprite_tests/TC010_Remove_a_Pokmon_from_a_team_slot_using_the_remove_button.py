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
        
        # -> Navigate to /play (explicit navigation step provided by the test).
        await page.goto("http://localhost:3000/play", wait_until="commit", timeout=10000)
        
        # -> Dismiss the privacy dialog by clicking 'Accept All', then click the Generation 1 game option (Red/Blue/Yellow).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/section/div[2]/button[3]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/main/div[3]/section[1]/a').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Click into the Pokémon search bar (focus the Pokémon search input so 'Pikachu' can be typed).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[3]/div/main/div[1]/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Type 'Pikachu' into the Pokémon search bar (input index 2149).
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/div/div[2]/section/div[1]/div/div[2]/div[1]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Pikachu')
        
        # -> Dismiss the guided tour popover (Skip tour), then click the Pikachu card to add it to the team.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div/div[2]/div[2]/div[2]/button[1]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/div/div[2]/section/div[3]/div/div/div/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Click the remove button for Pikachu in the team panel, then verify that 'Pikachu' is no longer visible in the team panel.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/div/div[1]/div[1]/section/div[2]/div[1]/button[1]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        # Wait briefly for the UI to settle after the removal action
        await page.wait_for_timeout(1000)
        # Verify the first team slot shows 'Empty' (slot returned to empty state)
        slot1_text = await frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/div/div[1]/div[1]/section/div[2]/div[1]/div/span[2]').inner_text()
        assert 'Empty' in slot1_text
        # Verify that the Pikachu card text is not visible in the UI area (use the Pikachu h3 element from the available elements list)
        is_pikachu_visible = await frame.locator('xpath=/html/body/div[2]/div/div/div[1]/main/div/div[2]/section/div[3]/div/div/div/div/div/div[2]/div[1]/h3').is_visible()
        assert not is_pikachu_visible
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    