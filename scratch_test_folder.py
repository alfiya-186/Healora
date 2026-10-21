import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1600,1000')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=options)
try:
    # 1. Login as Nutritionist
    driver.get("http://localhost:5173/signin")
    time.sleep(2)
    driver.find_element(By.XPATH, "//input[@type='email']").send_keys("sarah@gmail.com")
    driver.find_element(By.XPATH, "//input[@type='password']").send_keys("Test@1234")
    driver.find_element(By.XPATH, "//button[@type='submit']").click()
    time.sleep(3)

    # 2. Check current page
    print("Logged in, URL:", driver.current_url)

    # 3. Switch to Patient Directory / Case Sheet
    dir_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Patient Directory') or contains(text(), 'Directory')]")
    if dir_buttons:
        dir_buttons[0].click()
        time.sleep(1)

    # Click on a patient to open case file
    case_buttons = driver.find_elements(By.XPATH, "//button[contains(text(), 'Open Case File') or contains(text(), 'Case File') or contains(text(), 'View')]")
    if case_buttons:
        case_buttons[0].click()
        time.sleep(2)

    # 4. Find Clinical History & Longitudinal Tracking tab
    history_tabs = driver.find_elements(By.XPATH, "//*[contains(text(), 'Clinical History & Longitudinal Tracking') or contains(text(), 'Clinical History')]")
    if history_tabs:
        history_tabs[0].click()
        time.sleep(1)

    # Take screenshot of Collapsed Folder Card
    ss_collapsed = r"C:\Users\hp\.gemini\antigravity\brain\7135ed50-3b68-4376-9566-cb0e67d0e409\screenshots\folder_card_collapsed.png"
    driver.save_screenshot(ss_collapsed)
    print("Collapsed screenshot saved to:", ss_collapsed)

    # 5. Click the Folder Card to expand it
    folder_cards = driver.find_elements(By.XPATH, "//*[contains(text(), 'Patient Daily Adherence & Check-in Dossier') or contains(text(), 'Open Folder')]")
    if folder_cards:
        folder_cards[0].click()
        time.sleep(1)
        ss_open = r"C:\Users\hp\.gemini\antigravity\brain\7135ed50-3b68-4376-9566-cb0e67d0e409\screenshots\folder_card_open.png"
        driver.save_screenshot(ss_open)
        print("Open screenshot saved to:", ss_open)
    else:
        print("Folder card trigger not found via xpath, checking text elements...")

finally:
    driver.quit()
