from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Simulate a mobile device (iPhone 12)
    context = browser.new_context(
        viewport={'width': 844, 'height': 390},
        user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1',
        is_mobile=True,
        has_touch=True
    )
    page = context.new_page()

    print("Navigating to mobile version...")
    page.goto("http://localhost:3000/m/index.html")

    # Wait for the initial "Tap anywhere to start" text
    print("Waiting for 'Tap anywhere to start'...")
    try:
        page.wait_for_selector('text=Tap anywhere to start', timeout=5000)
    except:
        print("Initial text not found, taking debug screenshot.")
        page.screenshot(path="verification/debug_initial.png")
        raise

    # 1. Verify Initial State (Text Visible, Button Hidden)
    print("Verifying initial state...")
    page.screenshot(path="verification/1_initial_state.png")

    # 2. Simulate First Interaction (Global Tap)
    print("Simulating global tap...")
    page.touchscreen.tap(422, 195) # Center tap

    # 3. Wait for "PLAY NOW" button (appears after 3s delay)
    print("Waiting for 'PLAY NOW' button...")
    # The button text is "PLAY NOW"
    page.wait_for_selector('text=PLAY NOW', timeout=5000)
    page.screenshot(path="verification/2_play_now_visible.png")

    # 4. Tap "PLAY NOW" to start game
    print("Tapping 'PLAY NOW'...")
    page.touchscreen.tap(422, 290) # Approx position of button

    # 5. Verify Map Scene Loaded
    print("Waiting for Map Scene...")
    # Look for score text "0/60" which appears in MapScene
    page.wait_for_selector('text=0/60', timeout=5000)
    page.screenshot(path="verification/3_map_scene.png")

    # 6. Enter a Section (e.g., Grand Prismatic)
    # Map click coordinates need to be approximated based on map_sections.json logic
    # Grand Prismatic is roughly at x=340, y=360 on 1280x720 map.
    # Scaled to 844x390: x ~ 224, y ~ 195
    print("Entering Grand Prismatic section...")
    page.touchscreen.tap(224, 195)

    # 7. Verify SectionHunt Scene & Magnifying Glass Size
    print("Verifying SectionHunt Scene...")
    # Wait for magnifying glass image to exist
    page.wait_for_timeout(2000) # Give time for transition and fade in
    page.screenshot(path="verification/4_section_hunt.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
