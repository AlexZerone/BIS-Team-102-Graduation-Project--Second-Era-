#!/usr/bin/env python3
"""
Pre-deployment verification script for BIS Team 102 Flask Application
Checks that all critical files and configurations are in place.
"""
import os
import sys
from pathlib import Path

def check_file_exists(file_path, description=""):
    """Check if a file exists and return status"""
    if os.path.exists(file_path):
        size = os.path.getsize(file_path)
        print(f"✓ {description or file_path} ({size} bytes)")
        return True
    else:
        print(f"✗ {description or file_path} - MISSING")
        return False

def check_directory_exists(dir_path, description=""):
    """Check if a directory exists and return status"""
    if os.path.exists(dir_path) and os.path.isdir(dir_path):
        count = len(os.listdir(dir_path))
        print(f"✓ {description or dir_path} ({count} items)")
        return True
    else:
        print(f"✗ {description or dir_path} - MISSING")
        return False

def check_python_imports():
    """Check if critical Python modules can be imported"""
    print("\nChecking Python Dependencies:")
    print("-" * 40)
    
    modules = [
        'flask',
        'flask_wtf',
        'flask_wtf.csrf',
        'flask_mysqldb',
        'flask_moment',
        'wtforms',
        'werkzeug.security',
        'werkzeug.utils'
    ]
    
    passed = 0
    for module in modules:
        try:
            __import__(module)
            print(f"✓ {module}")
            passed += 1
        except ImportError as e:
            print(f"✗ {module} - {e}")
    
    return passed, len(modules)

def check_file_content(file_path, search_strings, description=""):
    """Check if file contains required content"""
    if not os.path.exists(file_path):
        print(f"✗ {description or file_path} - FILE MISSING")
        return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        missing = []
        for search_string in search_strings:
            if search_string not in content:
                missing.append(search_string)
        
        if not missing:
            print(f"✓ {description or file_path} - All required content found")
            return True
        else:
            print(f"⚠ {description or file_path} - Missing: {missing}")
            return False
    except Exception as e:
        print(f"✗ {description or file_path} - Error reading: {e}")
        return False

def main():
    """Main verification function"""
    print("BIS Team 102 Flask Application - Pre-deployment Verification")
    print("=" * 65)
    
    # Change to the script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    total_checks = 0
    passed_checks = 0
    
    # Core Application Files
    print("\nCore Application Files:")
    print("-" * 40)
    
    core_files = [
        ('app.py', 'Main Flask application'),
        ('config.py', 'Configuration file'),
        ('extensions.py', 'Extensions setup'),
        ('forms.py', 'WTForms definitions'),
        ('models.py', 'Database models'),
        ('permissions.py', 'Permission decorators'),
        ('requirements.txt', 'Python dependencies')
    ]
    
    for file_path, description in core_files:
        if check_file_exists(file_path, description):
            passed_checks += 1
        total_checks += 1
    
    # Route Files
    print("\nRoute Files:")
    print("-" * 40)
    
    route_files = [
        ('routes/auth.py', 'Authentication routes'),
        ('routes/admin.py', 'Admin routes'),
        ('routes/courses.py', 'Course routes'),
        ('routes/home.py', 'Home routes'),
        ('routes/dashboard.py', 'Dashboard routes'),
        ('routes/enrollments.py', 'Enrollment routes'),
        ('routes/jobs.py', 'Job routes'),
        ('routes/profile.py', 'Profile routes')
    ]
    
    for file_path, description in route_files:
        if check_file_exists(file_path, description):
            passed_checks += 1
        total_checks += 1
    
    # Template Directories
    print("\nTemplate Directories:")
    print("-" * 40)
    
    template_dirs = [
        ('templates/', 'Template root'),
        ('templates/auth/', 'Authentication templates'),
        ('templates/admin/', 'Admin templates'),
        ('templates/courses/', 'Course templates'),
        ('static/', 'Static files directory'),
        ('static/css/', 'CSS files'),
        ('static/js/', 'JavaScript files')
    ]
    
    for dir_path, description in template_dirs:
        if check_directory_exists(dir_path, description):
            passed_checks += 1
        total_checks += 1
    
    # Critical Templates
    print("\nCritical Templates:")
    print("-" * 40)
    
    critical_templates = [
        ('templates/base.html', 'Base template'),
        ('templates/auth/register.html', 'Registration template'),
        ('templates/auth/login.html', 'Login template'),
        ('templates/admin/dashboard.html', 'Admin dashboard'),
        ('templates/admin/pending_courses.html', 'Pending courses admin'),
        ('templates/admin/manage_courses.html', 'Course management admin'),
        ('templates/courses/create_course.html', 'Course creation form')
    ]
    
    for file_path, description in critical_templates:
        if check_file_exists(file_path, description):
            passed_checks += 1
        total_checks += 1
    
    # Database Files
    print("\nDatabase Files:")
    print("-" * 40)
    
    database_files = [
        ('database/flask0.db', 'SQLite database'),
        ('database/flask0.sql', 'Database schema')
    ]
    
    for file_path, description in database_files:
        if check_file_exists(file_path, description):
            passed_checks += 1
        total_checks += 1
    
    # Content Verification
    print("\nContent Verification:")
    print("-" * 40)
    
    # Check registration form has resume upload
    if check_file_content('templates/auth/register.html', 
                         ['resume_file', 'enctype="multipart/form-data"'], 
                         'Registration form with resume upload'):
        passed_checks += 1
    total_checks += 1
    
    # Check admin routes have course management
    if check_file_content('routes/admin.py', 
                         ['manage_courses', 'approve_course', 'reject_course'], 
                         'Admin routes with course management'):
        passed_checks += 1
    total_checks += 1
    
    # Check course routes have proper validation
    if check_file_content('routes/courses.py', 
                         ['create_course', 'CourseForm', 'validate'], 
                         'Course routes with validation'):
        passed_checks += 1
    total_checks += 1
      # Check forms have resume field
    if check_file_content('forms.py', 
                         ['FileField', 'resume_file'], 
                         'Forms with file upload support'):
        passed_checks += 1
    total_checks += 1
    
    # Python Dependencies
    py_passed, py_total = check_python_imports()
    passed_checks += py_passed
    total_checks += py_total
    
    # Summary
    print("\n" + "=" * 65)
    print("VERIFICATION SUMMARY")
    print("=" * 65)
    
    success_rate = (passed_checks / total_checks) * 100
    
    print(f"Total Checks: {total_checks}")
    print(f"Passed: {passed_checks}")
    print(f"Failed: {total_checks - passed_checks}")
    print(f"Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("\n✅ Application is ready for deployment!")
        print("All critical components are in place.")
    elif success_rate >= 80:
        print("\n⚠️  Application is mostly ready for deployment.")
        print("Some non-critical components may be missing.")
    else:
        print("\n❌ Application is NOT ready for deployment!")
        print("Critical components are missing.")
    
    # Recommendations
    print("\nRECOMMENDATIONS:")
    print("-" * 40)
    
    if success_rate < 100:
        print("1. Install missing Python dependencies: pip install -r requirements.txt")
        print("2. Ensure all template files are in place")
        print("3. Check database connection settings in config.py")
        print("4. Run the application in debug mode to test functionality")
    
    print("5. Test resume upload functionality manually")
    print("6. Test admin course approval workflow")
    print("7. Verify database schema matches application code")
    print("8. Test all user registration and login flows")
    
    return success_rate >= 80

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
