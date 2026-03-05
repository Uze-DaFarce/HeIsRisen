from playwright.sync_api import sync_playwright

def test_desktop(page):
    page.goto("http://localhost:8080/")
    page.wait_for_timeout(3000)

    # Click to start
    page.mouse.click(640, 360)
    page.wait_for_timeout(4000)

    # Click play now
    page.mouse.click(640, 580)
    page.wait_for_timeout(2000)

    # Go to Grand Prismatic (trigger via evaluate)
    page.evaluate('''() => {
        const mapScene = window.game.scene.scenes.find(s => s.scene.key === 'MapScene');
        mapScene.scene.start('SectionHunt', { sectionName: 'grand-prismatic' });
    }''')
    page.wait_for_timeout(2000)

    # Take screenshot of the map with the eggs
    page.screenshot(path="verification/desktop_grand_prismatic.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_desktop(page)
            print("Successfully verified desktop")
        except Exception as e:
            print("Failed", e)
        finally:
            browser.close()
