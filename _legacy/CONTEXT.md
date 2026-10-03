# Project Context

## Overview
This is a Flask-based web application providing an educational platform (Sec Era) for students, instructors, and companies.

## Recent Architectural Changes & Cleanups (October 2026)
- **Directory Cleanups**: Old backups, empty test files, and duplicate route files (`jobs.py.new`, `home_fixed.py`, `jobs_clean.py`, `uploads_simple.py`) were removed from the `routes/` and root directories to eliminate confusion.
- **Auth Refactoring**: 
  - Merged `/admin-login` and `/login` logic to eliminate duplicate code blocks in `routes/auth.py`. Admin users logging in via the standard `/login` route are now appropriately redirected to the admin dashboard.
  - Consolidated duplicate file upload handling functions (`allowed_file`, `create_upload_folder`) in `routes/auth.py` by importing the robust, unified versions from `models.py`.
- **Testing**: 
  - `pytest` configuration and test discovery was throwing multiple `ModuleNotFoundError`s and import mismatch errors because of old cached and duplicate files. These errors were cleaned up so that future testing can be done with a clean slate.
  - Some test folders like `_test` remain but should be considered legacy scripts that require proper integration testing isolation (e.g. mock DBs).

## Known Issues / Intentionally Skipped Risk Areas
- **Database Architecture / ORM**: The application heavily relies on raw SQL queries via `cursor.execute(query, params)`. Moving to an ORM (like SQLAlchemy) would be a massive architectural change with a high risk of breaking existing behavior. It was intentionally avoided during the 2026 modernization pass to preserve all existing functionality.
- **Hardcoded Secrets**: `config.py` contains default secret values (like the database password `''` and secret key `'159357'`). While flagged as a security risk, modifying these in the codebase without corresponding infrastructure updates could break local or production deployments, so they were left intact.
- **Legacy Directories**: Directories like `_test`, `_Ex`, and `_report` were kept because they might contain valuable historical design documents (e.g., `.bsdesign` files) or old scripts that the team still references.

## Tech Stack
- Backend: Python 3.12, Flask, PyMySQL / Flask-MySQLdb
- Frontend: HTML5, CSS3, Bootstrap 5.3, JavaScript (Vanilla)
- Database: MySQL
