import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1600,1200')
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

    # 2. Go to Assigned Patients
    assigned_btn = driver.find_elements(By.XPATH, "//*[contains(text(), 'Assigned Patients')]")
    if assigned_btn:
        assigned_btn[0].click()
        time.sleep(2)

    # 3. Click Open Case
    open_case_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Open Case')]")
    if open_case_btn:
        open_case_btn[0].click()
        time.sleep(2)
        print("Clicked Open Case successfully.")

    # 4. Scroll down to Section 5 (Clinical History & Longitudinal Tracking)
    driver.execute_script("window.scrollTo(0, 3200);")
    time.sleep(2)

    # Collapsed Folder Screenshot
    ss_dir = r"C:\Users\hp\.gemini\antigravity\brain\7135ed50-3b68-4376-9566-cb0e67d0e409\screenshots"
    ss_collapsed = os.path.join(ss_dir, "40_History_Folder_Card_Collapsed.png")
    driver.save_screenshot(ss_collapsed)
    print("Saved collapsed folder screenshot:", ss_collapsed)

    # 5. Click the Folder Card header to open it
    folder_toggle = driver.find_elements(By.XPATH, "//*[contains(text(), 'Patient Daily Adherence & Check-in Dossier') or contains(text(), 'Open Folder')]")
    if folder_toggle:
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", folder_toggle[0])
        time.sleep(1)
        folder_toggle[0].click()
        time.sleep(2)
        ss_open = os.path.join(ss_dir, "41_History_Folder_Card_Open.png")
        driver.save_screenshot(ss_open)
        print("Saved open folder screenshot:", ss_open)
    else:
        print("Folder toggle element not found!")

finally:
    driver.quit()
