# 🌿 Healora — Clinical Nutrition & Telehealth Management Platform

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Django](https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

**Healora** is an end-to-end clinical nutrition, personalized diet protocol, and telehealth management platform tailored for regional dietary ecosystems (specialized for Kerala & South Indian therapeutic meal protocols). It bridges the gap between patients, certified clinical nutritionists, and clinic management through structured 4-week medical care plans, telehealth video appointments, real-time messaging, and smart food swapping engines.

---

## ✨ Key Features & Portals

### 🧑‍⚕️ 1. Patient Portal
- **4-Week Clinical Protocol**: Structured weekly diet plans across 5 daily slots (*Breakfast, Clinical Drink / Smoothie, Lunch, Snack, Dinner*).
- **Two-Phase Consultation Gating**: Phase 1 (Weeks 1 & 2) unlocked by default; Phase 2 (Weeks 3 & 4) unlocked only after progress evaluation by the nutritionist.
- **Smart Kerala Food Swapping**: One-click swapping that strictly cycles through personalized Kerala alternatives tailored to health goals (e.g., Weight Loss, PCOS, Diabetes, Thyroid) with 100% verified authentic dish imagery.
- **Daily Wellness & Hydration Tracker**: Interactive 8-glass water tracking, sleep hours, mood logging, activity notes, and supplement confirmation.
- **Appointment Booking & 100% Cash Back Refunds**: Intelligent slot scheduling with conflict prevention (20–25 min intervals), holiday/leave blackout dates, card checkout simulation, and 1-click cancellation with automated cash back.
- **Diagnostic Vault**: Secure upload and categorization of medical records, CBC/Lipid panels, hormone assays, and DEXA scans.
- **PDF Protocol Export**: Download complete weekly schedules with automated grocery shopping lists.

---

### 🥗 2. Nutritionist Portal
- **Patient Directory & Clinical Intake**: Comprehensive patient profile inspection with lab report diagnostics, BMI/BMR calculation, and medical history review.
- **4-Week Care Plan Authoring**: Dynamic weekly and daily schedule editor with personalized suggestion dropdowns, custom food inputs, and live dish photo previews.
- **Phase 2 Unlock Control**: Review patient progress consultations and toggle Phase 2 release with instant notifications.
- **Evaluation & Notes Engine**: Publish weekly clinical feedback, nutritional ratings, and health adjustments.
- **Consultation Calendar**: Telehealth video link assignment (Google Meet / Zoom integration) and appointment status management.

---

### 🏥 3. Clinic Manager Portal
- **Appointment & Schedule Central**: Full operational overview of online and in-clinic appointments across all doctors and patients.
- **Clinic Holiday & Leave Management**: Create clinic-wide holidays or individual doctor leaves that immediately block calendar booking availability.
- **Financial & Refund Auditing**: Monitor transaction cash flows and processed cancellation refund payouts.
- **Cross-User Messaging**: Direct chat channel with patients and clinical staff.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide React, React Router DOM v7 |
| **Backend** | Python, Django, Django REST Framework (DRF) |
| **Database** | SQLite (Development) / PostgreSQL (Production-ready) |
| **Authentication**| JWT / Session-based role authentication (Patient, Nutritionist, Manager, Admin) |
| **Styling & Assets** | Custom Kerala Clinical Theme, Verified Local High-Definition Food Assets |

---

## 📂 Project Architecture

```plaintext
Healora/
├── healora-frontend/            # React 19 + Vite Frontend Application
│   ├── public/
│   │   └── foods/               # Authentic Kerala food & drink local assets
│   ├── src/
│   │   ├── components/          # Reusable UI (Calendar Picker, Time Slots, etc.)
│   │   ├── pages/               # Patient, Nutritionist & Manager Dashboards
│   │   ├── utils/               # Kerala Nutrition Engine & Image Resolver
│   │   ├── App.jsx              # Routing & Application Shell
│   │   └── index.css            # Tailwind CSS & Design System
│   └── package.json
│
├── healora_backend/             # Django REST API Backend
│   ├── core/                    # Core Medical Models, Views & Serializers
│   │   ├── models.py            # User, Profile, Appointment, DietPlan, Holiday
│   │   ├── views.py             # REST API ViewSets & Business Logic
│   │   └── urls.py              # API Endpoint Routes
│   ├── healora_backend/         # Django Project Configuration & Settings
│   └── manage.py
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.x or higher) & **npm**
- **Python** (v3.10 or higher) & **pip**
- **Git**

---

### 1. Backend Setup (Django)

```bash
# Navigate to the backend directory
cd healora_backend

# Create and activate a virtual environment
# On Windows:
python -m venv venv
venv\Scripts\activate

# On macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install django djangorestframework django-cors-headers

# Run database migrations
python manage.py migrate

# (Optional) Create a superuser
python manage.py createsuperuser

# Start the Django development server
python manage.py runserver
```
*Backend API will run at:* `http://127.0.0.1:8000/`

---

### 2. Frontend Setup (React + Vite)

```bash
# In a new terminal, navigate to the frontend directory
cd healora-frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```
*Frontend application will run at:* `http://localhost:5173/`

---

## 🔌 Core API Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/users/` | `GET`, `POST` | User registration & authentication |
| `/api/patient-profiles/` | `GET`, `POST`, `PUT` | Patient biometric & health data |
| `/api/appointments/` | `GET`, `POST`, `PATCH`| Appointment booking, slots & cancellations |
| `/api/diet-plans/` | `GET`, `POST`, `PUT` | 4-Week clinical care plan authoring & retrieval |
| `/api/wellness-logs/` | `GET`, `POST` | Daily hydration, sleep & habit logs |
| `/api/clinic-holidays/` | `GET`, `POST` | Manager holiday & leave blackouts |

---

## 🤝 Contributing

1. Fork the repository
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

