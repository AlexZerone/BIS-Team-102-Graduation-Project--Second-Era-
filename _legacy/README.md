# BIS Team 102 Graduation Project: Sec Era 🎓

Welcome to Team 102 - Graduation Project! We are a group of BIS (Business Information Systems) students working under the guidance of our university doctor to bring our graduation project to life.

**Sec Era** is a comprehensive educational and career platform designed to connect education with innovative security skills and career opportunities.

---

## 🎯 Project Overview & Purpose
Sec Era bridges the gap between learning and employment in the cybersecurity space. It provides a multi-tenant ecosystem where:
- **Students** can enroll in courses, submit assignments, manage their profiles, upload resumes, and apply for jobs.
- **Instructors** can manage courses, upload materials, grade assignments, and issue certificates.
- **Companies** can post job openings, receive applications, and find qualified candidates.
- **Administrators** can oversee the entire platform, manage user approvals, and monitor platform health.

## ✨ Key Features
* **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for Students, Instructors, Companies, and Admins.
* **Course & Enrollment Management:** End-to-end course lifecycle, from creation by instructors to enrollment and completion by students.
* **Career Portal:** Built-in job board where companies can post openings and students can submit applications directly.
* **File Management:** Secure uploads for profile images, student resumes, course materials, and administrative documents.
* **Subscriptions:** Tiered access plans for platform users.
* **Responsive Modern UI:** Built with Bootstrap 5.3, featuring dark mode support, micro-animations, and dynamic interactions.

## 🛠 Architecture & Tech Stack
* **Backend Framework:** Python 3.12 / Flask 3.0
* **Database:** MySQL (interfaced via `Flask-MySQLdb` and `PyMySQL`)
* **Frontend:** HTML5, Vanilla CSS3, Bootstrap 5.3, JavaScript
* **Templating:** Jinja2
* **Forms & Security:** Flask-WTF, Werkzeug, CSRF Protection

> **Note on Database Architecture:** This project intentionally uses raw SQL queries via MySQL cursors to interact with the database instead of an ORM (like SQLAlchemy). 

## ⚙️ Prerequisites
- Python 3.10+ (Recommended: 3.12)
- MySQL Server (v8.0+)
- `pip` (Python package manager)

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "Graduation Project (BIS)"
   ```

2. **Create and activate a virtual environment**
   ```bash
   # Windows
   python -m venv .venv
   .venv\Scripts\activate

   # macOS/Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Database Setup**
   - Ensure your MySQL server is running.
   - Create a database named `flask0`.
   - Import the database schema and initial data:
     ```bash
     mysql -u root -p flask0 < database/flask0.sql
     ```

5. **Configuration**
   The application uses default local configuration in `config.py`. For production or custom local setups, modify the following variables in `config.py` or set them as environment variables:
   ```python
   SECRET_KEY = 'your_secret_key'
   MYSQL_HOST = 'localhost'
   MYSQL_USER = 'root'
   MYSQL_PASSWORD = ''
   MYSQL_DB = 'flask0'
   ```

6. **Run the Application**
   ```bash
   python app.py
   ```
   The application will be accessible at `http://localhost:5000`.

## 📂 Project Structure
```
.
├── app.py                  # Application factory and entry point
├── config.py               # Application configuration
├── models.py               # Database interaction helpers and file validation
├── forms.py                # Flask-WTF form definitions
├── extensions.py           # Shared Flask extensions (e.g., mysql)
├── permissions.py          # RBAC decorators (@login_required)
├── routes/                 # Flask Blueprints (auth, courses, jobs, dashboard, etc.)
├── database/               # SQL schema files (flask0.sql)
├── static/                 # CSS, JavaScript, images, and uploaded files
└── templates/              # Jinja2 HTML templates and reusable components
```

## 🧪 Testing
The repository contains some legacy tests and scripts in the `_test/` directory. Note that the tests currently rely on a live MySQL database matching the local config.

To run tests (requires `pytest`):
```bash
python -m pytest
```

## 📝 License & Attribution
Created by Team 102 - BIS. All rights reserved.
