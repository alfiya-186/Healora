import pytest
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestPatientDashboard:
    def setup_method(self):
        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 15)

    def teardown_method(self):
        self.driver.quit()

    def test_patient_dashboard_page(self):
        # 1. Sign in as registered patient to authenticate session
        self.driver.get("http://localhost:5173/signin")
        email_input = self.wait.until(EC.visibility_of_element_located((By.XPATH, "//input[@type='email']")))
        email_input.send_keys("alf@gmail.com")
        self.driver.find_element(By.XPATH, "//input[@type='password']").send_keys("Test@1234")
        self.driver.find_element(By.XPATH, "//button[@type='submit']").click()

        # 2. Wait for redirect and verify Patient Dashboard route
        self.wait.until(EC.url_contains("patient-dashboard"))
        assert "patient-dashboard" in self.driver.current_url.lower()
