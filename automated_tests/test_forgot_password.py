import sys, time
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

options = Options()
options.add_argument('--headless=new')
options.add_argument('--window-size=1280,900')
driver = webdriver.Chrome(options=options)
try:
    print('1. Opening SignIn page...')
    driver.get('http://localhost:5173/signin')
    time.sleep(2)

    # Click Forgot password?
    print('2. Clicking Forgot password link...')
    driver.execute_script("""
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Forgot password?'));
        if (btn) btn.click();
    """)
    time.sleep(1.5)
    driver.save_screenshot('e:/Healora/automated_tests/screenshots/47_Forgot_Password_Step1.png')

    # Type email and request code
    print('3. Submitting email...')
    driver.execute_script("""
        const emailInput = document.querySelector('input[type="email"]');
        if (emailInput) {
            emailInput.value = 'alf@gmail.com';
            emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Send Verification Code'));
        if (submitBtn) submitBtn.click();
    """)
    time.sleep(2)
    driver.save_screenshot('e:/Healora/automated_tests/screenshots/48_Forgot_Password_Step2_Code.png')

    # Click Auto-fill and fill passwords
    print('4. Filling verification code & new password...')
    driver.execute_script("""
        const autofillBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Auto-fill'));
        if (autofillBtn) autofillBtn.click();
        
        const pwdInputs = document.querySelectorAll('input[type="password"], input[type="text"][placeholder*="password"]');
        if (pwdInputs.length >= 2) {
            pwdInputs[0].value = 'AlfPass@2026';
            pwdInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
            pwdInputs[1].value = 'AlfPass@2026';
            pwdInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        }
        const resetBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Reset & Save Password'));
        if (resetBtn) resetBtn.click();
    """)
    time.sleep(2)
    driver.save_screenshot('e:/Healora/automated_tests/screenshots/49_Forgot_Password_Step3_Success.png')

    # Click Sign In With New Password
    print('5. Finishing reset and signing in...')
    driver.execute_script("""
        const finishBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign In With New Password'));
        if (finishBtn) finishBtn.click();
    """)
    time.sleep(1.5)

    # Click Sign In on the main login form
    driver.find_element(By.XPATH, '//button[@type="submit"]').click()
    WebDriverWait(driver, 10).until(lambda d: 'patient-dashboard' in d.current_url)
    print('SUCCESS! Redirected to:', driver.current_url)
    driver.save_screenshot('e:/Healora/automated_tests/screenshots/50_Login_With_New_Password.png')
finally:
    driver.quit()

