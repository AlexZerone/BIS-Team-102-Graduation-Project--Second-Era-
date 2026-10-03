#!/usr/bin/env python3
"""
Integration test script for BIS Team 102 Graduation Project Flask Application
Tests the major user flows and functionality.
"""
import sys
import os
import requests
import json
from datetime import datetime

# Add the parent directory to the path to import the app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up test configuration
BASE_URL = 'http://localhost:5000'
TEST_DATA = {
    'student': {
        'first_name': 'Test',
        'last_name': 'Student',
        'email': 'test.student@example.com',
        'password': 'TestPassword123!',
        'confirm_password': 'TestPassword123!',
        'phone': '1234567890',
        'date_of_birth': '1995-01-01',
        'university': 'Test University',
        'major': 'Computer Science',
        'year': 3,
        'gpa': 3.5,
        'bio': 'Test student bio'
    },
    'instructor': {
        'first_name': 'Test',
        'last_name': 'Instructor',
        'email': 'test.instructor@example.com',
        'password': 'TestPassword123!',
        'confirm_password': 'TestPassword123!',
        'phone': '1234567891',
        'date_of_birth': '1980-01-01',
        'university': 'Test University',
        'department': 'Computer Science',
        'position': 'Assistant Professor',
        'bio': 'Test instructor bio'
    },
    'admin': {
        'email': 'admin@example.com',
        'password': 'AdminPassword123!'
    },
    'course': {
        'title': 'Test Course',
        'course_code': 'CS101',
        'description': 'A test course for testing purposes',
        'department': 'Computer Science',
        'credits': 3,
        'duration': '4 months',
        'max_students': 30,
        'prerequisites': 'Basic programming knowledge',
        'learning_objectives': 'Students will learn testing fundamentals',
        'start_date': '2024-02-01',
        'end_date': '2024-06-01',
        'course_type': 'undergraduate'
    }
}

class TestResults:
    def __init__(self):
        self.results = []
        self.session = requests.Session()
        
    def add_result(self, test_name, status, message="", details=None):
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details or {}
        }
        self.results.append(result)
        
        # Print result immediately
        status_symbol = "✓" if status == "PASS" else "✗" if status == "FAIL" else "⚠"
        print(f"{status_symbol} {test_name}: {message}")
        
    def get_csrf_token(self, url):
        """Get CSRF token from a form page"""
        try:
            response = self.session.get(url)
            if response.status_code == 200:
                # Simple extraction - look for csrf_token input
                if 'csrf_token' in response.text:
                    # Extract token from HTML (basic approach)
                    import re
                    match = re.search(r'name="csrf_token"[^>]*value="([^"]*)"', response.text)
                    if match:
                        return match.group(1)
            return None
        except Exception as e:
            print(f"Error getting CSRF token: {e}")
            return None
            
    def test_home_page(self):
        """Test that the home page loads"""
        try:
            response = self.session.get(BASE_URL)
            if response.status_code == 200:
                self.add_result("Home Page Load", "PASS", "Home page loaded successfully")
                return True
            else:
                self.add_result("Home Page Load", "FAIL", f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.add_result("Home Page Load", "FAIL", f"Error: {str(e)}")
            return False
            
    def test_registration_form(self):
        """Test that the registration form loads"""
        try:
            response = self.session.get(f"{BASE_URL}/register")
            if response.status_code == 200:
                # Check for key form elements
                required_elements = ['first_name', 'last_name', 'email', 'password', 'resume_file']
                missing_elements = []
                
                for element in required_elements:
                    if element not in response.text:
                        missing_elements.append(element)
                
                if not missing_elements:
                    self.add_result("Registration Form Load", "PASS", "Registration form loaded with all required elements")
                    return True
                else:
                    self.add_result("Registration Form Load", "FAIL", f"Missing elements: {missing_elements}")
                    return False
            else:
                self.add_result("Registration Form Load", "FAIL", f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.add_result("Registration Form Load", "FAIL", f"Error: {str(e)}")
            return False
            
    def test_login_form(self):
        """Test that the login form loads"""
        try:
            response = self.session.get(f"{BASE_URL}/login")
            if response.status_code == 200:
                # Check for key form elements
                if 'email' in response.text and 'password' in response.text:
                    self.add_result("Login Form Load", "PASS", "Login form loaded successfully")
                    return True
                else:
                    self.add_result("Login Form Load", "FAIL", "Login form missing required elements")
                    return False
            else:
                self.add_result("Login Form Load", "FAIL", f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.add_result("Login Form Load", "FAIL", f"Error: {str(e)}")
            return False
            
    def test_course_creation_form(self):
        """Test that the course creation form loads"""
        try:
            response = self.session.get(f"{BASE_URL}/courses/create")
            if response.status_code == 200:
                # Check for key form elements
                required_elements = ['title', 'description', 'start_date', 'end_date']
                missing_elements = []
                
                for element in required_elements:
                    if element not in response.text:
                        missing_elements.append(element)
                
                if not missing_elements:
                    self.add_result("Course Creation Form Load", "PASS", "Course creation form loaded with required elements")
                    return True
                else:
                    self.add_result("Course Creation Form Load", "FAIL", f"Missing elements: {missing_elements}")
                    return False
            else:
                self.add_result("Course Creation Form Load", "FAIL", f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.add_result("Course Creation Form Load", "FAIL", f"Error: {str(e)}")
            return False
            
    def test_admin_pages(self):
        """Test that admin pages load (without authentication)"""
        admin_pages = [
            '/admin/dashboard',
            '/admin/users',
            '/admin/pending-courses',
            '/admin/manage-courses'
        ]
        
        total_tests = len(admin_pages)
        passed_tests = 0
        
        for page in admin_pages:
            try:
                response = self.session.get(f"{BASE_URL}{page}")
                # Expect either 200 (if accessible) or 302/401 (if authentication required)
                if response.status_code in [200, 302, 401, 403]:
                    passed_tests += 1
                    self.add_result(f"Admin Page {page}", "PASS", f"Status: {response.status_code}")
                else:
                    self.add_result(f"Admin Page {page}", "FAIL", f"Unexpected status: {response.status_code}")
            except Exception as e:
                self.add_result(f"Admin Page {page}", "FAIL", f"Error: {str(e)}")
        
        if passed_tests == total_tests:
            self.add_result("Admin Pages Load", "PASS", f"All {total_tests} admin pages responded correctly")
        else:
            self.add_result("Admin Pages Load", "FAIL", f"Only {passed_tests}/{total_tests} admin pages responded correctly")
            
    def test_static_files(self):
        """Test that static files load"""
        static_files = [
            '/static/css/bootstrap.min.css',
            '/static/js/bootstrap.bundle.min.js',
            '/static/css/style.css'
        ]
        
        total_tests = len(static_files)
        passed_tests = 0
        
        for file_path in static_files:
            try:
                response = self.session.get(f"{BASE_URL}{file_path}")
                if response.status_code == 200:
                    passed_tests += 1
                    self.add_result(f"Static File {file_path}", "PASS", "File loaded successfully")
                else:
                    self.add_result(f"Static File {file_path}", "FAIL", f"Status: {response.status_code}")
            except Exception as e:
                self.add_result(f"Static File {file_path}", "FAIL", f"Error: {str(e)}")
        
        if passed_tests == total_tests:
            self.add_result("Static Files Load", "PASS", f"All {total_tests} static files loaded")
        else:
            self.add_result("Static Files Load", "WARN", f"Only {passed_tests}/{total_tests} static files loaded")
            
    def run_all_tests(self):
        """Run all tests"""
        print("Starting BIS Team 102 Flask Application Tests...")
        print("=" * 50)
        
        # Test basic functionality
        self.test_home_page()
        self.test_registration_form()
        self.test_login_form()
        self.test_course_creation_form()
        self.test_admin_pages()
        self.test_static_files()
        
        # Generate summary
        print("\n" + "=" * 50)
        print("TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['status'] == 'PASS')
        failed_tests = sum(1 for r in self.results if r['status'] == 'FAIL')
        warned_tests = sum(1 for r in self.results if r['status'] == 'WARN')
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Warnings: {warned_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        # Save results to file
        with open('test_results.json', 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\nDetailed results saved to test_results.json")
        
        return passed_tests, failed_tests, warned_tests

def main():
    """Main test runner"""
    print("BIS Team 102 Graduation Project - Integration Test Suite")
    print("=" * 60)
    
    # Create test instance
    tester = TestResults()
    
    # Run tests
    passed, failed, warned = tester.run_all_tests()
    
    # Exit with appropriate code
    if failed > 0:
        print(f"\n❌ {failed} tests failed!")
        sys.exit(1)
    elif warned > 0:
        print(f"\n⚠️  {warned} tests had warnings")
        sys.exit(0)
    else:
        print(f"\n✅ All tests passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()
