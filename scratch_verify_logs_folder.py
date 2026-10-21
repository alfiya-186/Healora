import time
import os
import json
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

    # 2. Add sample daily check-in logs to localStorage for patient #28 (matching user screenshot)
    sample_logs = [
        {
            "id": 101,
            "patientId": "28",
            "date": "2026-10-04",
            "completed_slots": {
                "pre_breakfast": False,
                "breakfast": False,
                "drink": False,
                "lunch": False,
                "snack": False,
                "dinner": True
            },
            "water_glasses": 4,
            "sleep_hours": 7.5,
            "physical_activity": "30 mins brisk walking",
            "mood": "Calm & Balanced",
            "ate_other_food": False
        },
        {
            "id": 102,
            "patientId": "28",
            "date": "2026-10-03",
            "completed_slots": {
                "breakfast": False,
                "lunch": False,
                "dinner": False
            },
            "water_glasses": 4,
            "sleep_hours": 7.5,
            "physical_activity": "30 mins brisk walking",
            "mood": "Normal",
            "ate_other_food": False
        },
        {
            "id": 103,
            "patientId": "28",
            "date": "2026-09-25",
            "completed_slots": {
                "pre_breakfast": False,
                "breakfast": False,
                "drink": False,
                "lunch": True,
                "snack": False,
                "dinner": False
            },
            "water_glasses": 4,
            "sleep_hours": 7.5,
            "physical_activity": "30 mins brisk walking",
            "mood": "Calm & Balanced",
            "ate_other_food": False
        },
        {
            "id": 104,
            "patientId": "28",
            "date": "2026-09-24",
            "completed_slots": {
                "pre_breakfast": True,
                "breakfast": True,
                "drink": True,
                "lunch": True,
                "snack": True,
                "dinner": True
            },
            "water_glasses": 8,
            "sleep_hours": 8,
            "physical_activity": "45 mins aerobic workout",
            "mood": "Energized",
            "ate_other_food": False
        }
    ]

    driver.execute_script(f"""
        localStorage.setItem('healora_wellness_28', '{json.dumps(sample_logs)}');
        localStorage.setItem('healora_all_wellness_logs', '{json.dumps(sample_logs)}');
    """)
    time.sleep(1)

    # 3. Go to Assigned Patients
    assigned_btn = driver.find_elements(By.XPATH, "//*[contains(text(), 'Assigned Patients')]")
    if assigned_btn:
        assigned_btn[0].click()
        time.sleep(2)

    # 4. Click Open Case
    open_case_btn = driver.find_elements(By.XPATH, "//button[contains(., 'Open Case')]")
    if open_case_btn:
        open_case_btn[0].click()
        time.sleep(2)

    # 5. Scroll down to Section 5 Folder Card
    driver.execute_script("window.scrollTo(0, 3200);")
    time.sleep(1)

    ss_dir = r"C:\Users\hp\.gemini\antigravity\brain\7135ed50-3b68-4376-9566-cb0e67d0e409\screenshots"
    ss_collapsed = os.path.join(ss_dir, "42_Folder_Card_With_Data_Collapsed.png")
    driver.save_screenshot(ss_collapsed)
    print("Saved collapsed folder screenshot:", ss_collapsed)

    # 6. Click Folder Header to open
    folder_toggle = driver.find_elements(By.XPATH, "//*[contains(text(), 'Patient Daily Adherence & Check-in Dossier') or contains(text(), 'Open Folder')]")
    if folder_toggle:
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", folder_toggle[0])
        time.sleep(1)
        folder_toggle[0].click()
        time.sleep(2)

        ss_open = os.path.join(ss_dir, "43_Folder_Card_With_Data_Open.png")
        driver.save_screenshot(ss_open)
        print("Saved open folder screenshot:", ss_open)
    else:
        print("Folder toggle not found!")

finally:
    driver.quit()
