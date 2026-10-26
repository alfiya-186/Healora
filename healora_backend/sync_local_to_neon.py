"""
Healora Database Transfer Utility: Local PostgreSQL -> Hosted Neon PostgreSQL
Safely migrates the Neon schema and synchronizes existing user accounts without exposing secrets or plaintext passwords.
"""

import os
import sys
import re
import getpass
from urllib.parse import urlparse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Ensure local dev settings are loaded first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healora_backend.settings')

def clean_and_validate_database_url(raw_url: str) -> str:
    """
    Sanitizes and validates the database connection string:
    - Strips invisible Unicode characters (BOM, zero-width spaces, directional marks)
    - Strips control characters like \x16 (Ctrl+V)
    - Safely extracts postgresql:// or postgres:// URL even if surrounded by quotes,
      bracketed, or prefixed by CLI / .env wrappers (e.g., 'psql', 'DATABASE_URL =', etc.)
    - Normalizes scheme to lowercase ('postgresql://' or 'postgres://')
    - Strips any trailing punctuation or quotation artifacts
    - Validates scheme is strictly postgresql:// or postgres://
    - Validates that a non-empty hostname is present
    Never prints or leaks the raw URL or credentials.
    """
    if not raw_url:
        raise ValueError("No connection URL provided.")

    # 1. Strip invisible Unicode characters (BOM, zero-width spaces, control chars) and outer whitespace
    cleaned = raw_url.replace('\ufeff', '').replace('\u200b', '').replace('\u200e', '').replace('\u200f', '').replace('\x16', '').strip()

    # 2. Extract the actual postgres URI using case-insensitive regex
    # Matches starting from 'postgres://' or 'postgresql://' up to whitespace or quote/delimiter characters
    match = re.search(r'(postgres(?:ql)?://[^\s\'\"`“”‘’;,]+)', cleaned, re.IGNORECASE)
    if not match:
        raise ValueError(
            "Invalid database URL scheme. The connection string must start with 'postgresql://' or 'postgres://'."
        )

    url = match.group(1).strip()

    # 3. Canonicalize scheme to lowercase
    scheme_end = url.find('://')
    scheme = url[:scheme_end].lower()
    url = scheme + url[scheme_end:]

    # 4. Strip any trailing punctuation or quotation characters
    url = url.rstrip('\'"`“”‘’;,')

    # 5. Validate basic URL structure and hostname presence
    try:
        parsed = urlparse(url)
        if not parsed.hostname:
            raise ValueError("Invalid database URL. Hostname is missing from the connection string.")
    except Exception as e:
        raise ValueError("Could not parse database URL structure.") from e

    return url

def get_windows_clipboard() -> str:
    """Safely retrieves text from the Windows clipboard without third-party dependencies."""
    if sys.platform != 'win32':
        return ""
    try:
        import ctypes
        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32
        if user32.OpenClipboard(None):
            try:
                CF_UNICODETEXT = 13
                h_mem = user32.GetClipboardData(CF_UNICODETEXT)
                if h_mem:
                    p_mem = kernel32.GlobalLock(h_mem)
                    if p_mem:
                        val = ctypes.c_wchar_p(p_mem).value
                        kernel32.GlobalUnlock(h_mem)
                        return val or ""
            finally:
                user32.CloseClipboard()
    except Exception:
        pass
    return ""

def read_hidden_input(prompt: str) -> str:
    """
    Reads hidden input from the user.
    On Windows consoles, standard getpass.getpass() does not handle Ctrl+V (clipboard paste),
    capturing only the raw byte \\x16 instead of the pasted text.
    This function intercepts Ctrl+V (\\x16) on Windows and pastes directly from the clipboard
    while keeping the input completely hidden and credentials unlogged.
    """
    if sys.platform == 'win32' and sys.stdin.isatty():
        try:
            import msvcrt
            sys.stdout.write(prompt)
            sys.stdout.flush()
            chars = []
            while True:
                ch = msvcrt.getwch()
                if ch in ('\r', '\n'):
                    sys.stdout.write('\n')
                    sys.stdout.flush()
                    break
                elif ch == '\x03':  # Ctrl+C
                    sys.stdout.write('\n')
                    sys.stdout.flush()
                    raise KeyboardInterrupt
                elif ch == '\x16':  # Ctrl+V (paste from clipboard)
                    clip_text = get_windows_clipboard()
                    if clip_text:
                        clip_clean = clip_text.replace('\r', '').replace('\n', '')
                        chars.append(clip_clean)
                elif ch == '\b':  # Backspace
                    if chars:
                        chars.pop()
                else:
                    chars.append(ch)
            return "".join(chars)
        except Exception:
            pass

    # Fallback to standard getpass
    return getpass.getpass(prompt)

def main():
    print("=" * 70)
    print("      Healora Database Synchronization Utility (Local -> Neon)")
    print("=" * 70)
    
    # 1. Ask for Neon DATABASE_URL securely (do not echo/log)
    raw_neon_url = os.environ.get('NEON_DATABASE_URL') or os.environ.get('DATABASE_URL')
    if not raw_neon_url:
        print("\nPlease enter your Neon PostgreSQL connection string (DATABASE_URL).")
        print("Tip: Find this in your Neon Console -> Dashboard -> Connection String.")
        try:
            raw_neon_url = read_hidden_input("Neon DATABASE_URL (input hidden): ")
        except Exception:
            raw_neon_url = input("Neon DATABASE_URL: ")

        # If hidden input was empty or only had Ctrl+V / control bytes, check clipboard or fallback
        if not raw_neon_url or not raw_neon_url.replace('\x16', '').strip():
            clip_val = get_windows_clipboard()
            if clip_val and ('postgres' in clip_val.lower()):
                raw_neon_url = clip_val
            else:
                print("\n[Notice] Hidden input was empty. Enter the connection string below:")
                raw_neon_url = input("Neon DATABASE_URL: ")

    # 2. Clean and validate URL before any parsing or database operations
    try:
        cleaned_neon_url = clean_and_validate_database_url(raw_neon_url)
    except ValueError as val_err:
        print(f"\n[-] Error: {val_err}")
        print("[-] Tip: Copy the connection string directly from Neon Console:")
        print("         postgresql://neondb_owner:***@ep-***.aws.neon.tech/neondb?sslmode=require")
        return 1

    # 3. Setup Django with local database first
    import django
    django.setup()
    
    from django.core.management import call_command
    from django.db import connections
    import dj_database_url
    from core.models import (
        User, PatientProfile, Appointment, DietPlan, 
        WellnessLog, ClinicHoliday, TelehealthSignal
    )
    
    # Check local database records (read-only)
    local_user_count = User.objects.using('default').count()
    print(f"\n[+] Local PostgreSQL Database connected successfully.")
    print(f"[+] Found {local_user_count} existing user account(s) in local database.")
    
    if local_user_count == 0:
        print("[-] Warning: No users found in local database. Aborting.")
        return 1

    # 4. Parse and configure distinct 'neon' database connection alias
    # Clone 'default' database settings so all required Django keys (TIME_ZONE, ATOMIC_REQUESTS, AUTOCOMMIT, TEST) are present
    neon_db_config = connections.databases['default'].copy()
    parsed_config = dj_database_url.parse(
        cleaned_neon_url,
        conn_max_age=600,
        conn_health_checks=True,
        ssl_require=True
    )
    neon_db_config.update(parsed_config)

    # Ensure required Django settings keys have proper defaults
    neon_db_config.setdefault('ATOMIC_REQUESTS', False)
    neon_db_config.setdefault('AUTOCOMMIT', True)
    neon_db_config.setdefault('TIME_ZONE', None)
    neon_db_config.setdefault('CONN_MAX_AGE', 600)
    neon_db_config.setdefault('CONN_HEALTH_CHECKS', True)

    # Merge OPTIONS and enforce sslmode=require
    neon_options = dict(neon_db_config.get('OPTIONS', {}))
    neon_options.update(parsed_config.get('OPTIONS', {}))
    neon_options['sslmode'] = 'require'
    neon_db_config['OPTIONS'] = neon_options

    # Enable Neon PgBouncer transaction-pooling compatibility
    neon_db_config['DISABLE_SERVER_SIDE_CURSORS'] = True
    connections.databases['neon'] = neon_db_config

    # 5. Verify Neon connection can be established before proceeding
    print("\n[+] Testing connection to Neon PostgreSQL...")
    try:
        with connections['neon'].cursor() as cursor:
            cursor.execute("SELECT version();")
            version_info = cursor.fetchone()
        print("[+] Connection to Neon PostgreSQL established successfully!")
    except Exception as conn_err:
        print(f"\n[-] Failed to connect to Neon PostgreSQL: {conn_err}")
        print("[-] Please verify your Neon database URL, credentials, and network connection.")
        return 1

    # 6. User Confirmation Step
    print("\n" + "-" * 70)
    print("                      PENDING ACTIONS SUMMARY")
    print("-" * 70)
    print(f"  • Source: Local PostgreSQL ({local_user_count} User accounts)")
    print(f"  • Destination Host: {neon_db_config.get('HOST')}")
    print(f"  • Destination Database: {neon_db_config.get('NAME')}")
    print("  • Actions to perform:")
    print("      1. Apply Django schema migrations to Neon PostgreSQL.")
    print("      2. Safely synchronize all existing user accounts and records.")
    print("      3. Update PostgreSQL auto-increment sequences on Neon.")
    print("  • Safety guarantee: Local database is read-only and never modified.")
    print("-" * 70)

    try:
        confirm = input("\nDo you want to proceed with migrating and importing into Neon? (yes/no): ").strip().lower()
    except (KeyboardInterrupt, EOFError):
        print("\n[-] Cancelled by user.")
        return 0

    if confirm not in ('yes', 'y'):
        print("[-] Operation cancelled by user. Neon database remains unchanged.")
        return 0

    # 7. Apply migrations specifically on Neon
    print("\n[+] Applying Django database migrations on Neon PostgreSQL...")
    call_command('migrate', database='neon', interactive=False)
    print("[+] Migrations completed successfully on Neon!")

    # 8. Transfer records model-by-model using update_or_create to prevent duplicates
    print("\n[+] Synchronizing records into Neon PostgreSQL without duplication...")

    # Transfer Users
    users_created = 0
    users_updated = 0
    for local_u in User.objects.using('default').all():
        user_fields = {
            f.name: getattr(local_u, f.name)
            for f in User._meta.fields
            if f.name not in ('groups', 'user_permissions')
        }
        _, created = User.objects.using('neon').update_or_create(
            email=local_u.email,
            defaults=user_fields
        )
        if created:
            users_created += 1
        else:
            users_updated += 1
    print(f"[+] Users synchronized: {users_created} created, {users_updated} verified.")

    # Transfer PatientProfiles
    profiles_synced = 0
    for local_p in PatientProfile.objects.using('default').all():
        p_fields = {
            f.name: getattr(local_p, f.name)
            for f in PatientProfile._meta.fields
            if f.name != 'user'
        }
        p_fields['user_id'] = local_p.user_id
        PatientProfile.objects.using('neon').update_or_create(
            user_id=local_p.user_id,
            defaults=p_fields
        )
        profiles_synced += 1

    # Transfer Appointments
    appts_synced = 0
    for local_a in Appointment.objects.using('default').all():
        a_fields = {
            f.name: getattr(local_a, f.name)
            for f in Appointment._meta.fields
            if f.name not in ('patient', 'nutritionist')
        }
        a_fields['patient_id'] = local_a.patient_id
        a_fields['nutritionist_id'] = local_a.nutritionist_id
        Appointment.objects.using('neon').update_or_create(
            id=local_a.id,
            defaults=a_fields
        )
        appts_synced += 1

    # Transfer DietPlans
    diets_synced = 0
    for local_d in DietPlan.objects.using('default').all():
        d_fields = {
            f.name: getattr(local_d, f.name)
            for f in DietPlan._meta.fields
            if f.name not in ('patient', 'nutritionist')
        }
        d_fields['patient_id'] = local_d.patient_id
        d_fields['nutritionist_id'] = local_d.nutritionist_id
        DietPlan.objects.using('neon').update_or_create(
            id=local_d.id,
            defaults=d_fields
        )
        diets_synced += 1

    # Transfer WellnessLogs
    wellness_synced = 0
    for local_w in WellnessLog.objects.using('default').all():
        w_fields = {
            f.name: getattr(local_w, f.name)
            for f in WellnessLog._meta.fields
            if f.name != 'patient'
        }
        w_fields['patient_id'] = local_w.patient_id
        WellnessLog.objects.using('neon').update_or_create(
            id=local_w.id,
            defaults=w_fields
        )
        wellness_synced += 1

    # Transfer ClinicHolidays
    holidays_synced = 0
    for local_h in ClinicHoliday.objects.using('default').all():
        h_fields = {
            f.name: getattr(local_h, f.name)
            for f in ClinicHoliday._meta.fields
        }
        ClinicHoliday.objects.using('neon').update_or_create(
            id=local_h.id,
            defaults=h_fields
        )
        holidays_synced += 1

    # Transfer TelehealthSignals
    signals_synced = 0
    for local_s in TelehealthSignal.objects.using('default').all():
        s_fields = {
            f.name: getattr(local_s, f.name)
            for f in TelehealthSignal._meta.fields
            if f.name not in ('appointment', 'sender')
        }
        s_fields['appointment_id'] = local_s.appointment_id
        s_fields['sender_id'] = local_s.sender_id
        TelehealthSignal.objects.using('neon').update_or_create(
            id=local_s.id,
            defaults=s_fields
        )
        signals_synced += 1

    print(f"[+] Related records synchronized: {profiles_synced} Profiles, {appts_synced} Appointments, {diets_synced} Diet Plans, {wellness_synced} Wellness Logs, {holidays_synced} Holidays, {signals_synced} Telehealth Signals.")

    # 9. Update PostgreSQL auto-increment sequences on Neon to max(id)
    print("\n[+] Synchronizing PostgreSQL primary key sequences on Neon...")
    with connections['neon'].cursor() as cursor:
        sequence_tables = [
            'core_user',
            'core_patientprofile',
            'core_appointment',
            'core_dietplan',
            'core_wellnesslog',
            'core_clinicholiday',
            'core_telehealthsignal'
        ]
        for tbl in sequence_tables:
            try:
                cursor.execute(f"""
                    SELECT setval(
                        pg_get_serial_sequence('{tbl}', 'id'),
                        COALESCE((SELECT MAX(id) FROM {tbl}), 1)
                    );
                """)
            except Exception:
                pass

    # 10. Verification: Query directly and exclusively against the 'neon' database connection
    print("\n" + "=" * 70)
    print("             VERIFICATION REPORT (QUERIED FROM NEON)")
    print("=" * 70)
    neon_user_count = User.objects.using('neon').count()
    print(f"[*] Verified Total Users in Neon: {neon_user_count}")
    for model in [User, PatientProfile, Appointment, DietPlan, WellnessLog, ClinicHoliday, TelehealthSignal]:
        count = model.objects.using('neon').count()
        print(f"    - {model.__name__}: {count} records in Neon")

    # Confirm database name on remote server
    with connections['neon'].cursor() as cursor:
        cursor.execute("SELECT current_database();")
        active_db = cursor.fetchone()[0]
        print(f"\n[*] Confirmed: All queries executed on remote database '{active_db}'.")

    print("\n[SUCCESS] Your existing accounts and passwords are now active in Neon!")
    print("You can now sign in on https://healora-tau.vercel.app with your existing credentials.")
    return 0

if __name__ == '__main__':
    sys.exit(main())
