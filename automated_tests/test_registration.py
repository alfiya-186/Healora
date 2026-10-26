import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestRegistration:
    def setup_method(self):
        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 10)

    def teardown_method(self):
        self.driver.quit()

    def test_registration_page(self):
        self.driver.get("http://localhost:5173/signup")
        self.wait.until(EC.visibility_of_element_located((By.TAG_NAME, "body")))
        assert "signup" in self.driver.current_url.lower()

