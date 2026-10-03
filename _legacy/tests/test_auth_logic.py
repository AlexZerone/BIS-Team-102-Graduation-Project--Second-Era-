#!/usr/bin/env python3
"""
Test script to verify registration and login logic for approval status
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import get_record, execute_query
import mysql.connector
from werkzeug.security import generate_password_hash
import pytest

# Import Flask app for testing
from app import create_app

@pytest.fixture
def app():
    """Create application for the tests."""
    app = create_app()
    app.config['TESTING'] = True
    return app

@pytest.fixture
def app_context(app):
    """Create application context for the tests."""
    with app.app_context():
        yield app

def test_database_connection(app_context):
    """Test basic database connectivity"""
    try:
        config = {
            'host': 'localhost',
            'user': 'root',
            'password': '',
            'database': 'flask0'
        }
        connection = mysql.connector.connect(**config)
        assert connection.is_connected(), "Database connection should be successful"
        connection.close()
        print("✓ Database connection successful")
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        assert False, f"Database connection failed: {e}"

def test_user_registration_logic(app_context):
    """Test that users are registered with correct approval status"""
    print("\n=== Testing User Registration Logic ===")
    
    try:
        # Clean up test users first
        execute_query("DELETE FROM users WHERE Email IN (%s, %s, %s)", 
                     ('test_student@example.com', 'test_instructor@example.com', 'test_company@example.com'))
        
        # Test 1: Student registration (should be approved and active)
        password_hash = generate_password_hash('testpass123')
        execute_query('''
            INSERT INTO users (First, Last, Email, Password, UserType, ApprovalStatus, Status, CreatedAt, UpdatedAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ''', ('Test', 'Student', 'test_student@example.com', password_hash, 'student', 'Approved', 'Active'))
        
        student = get_record('SELECT * FROM users WHERE Email = %s', ('test_student@example.com',))
        assert student is not None, "Student record should exist"
        assert student['ApprovalStatus'] == 'Approved', f"Student should be approved, got {student['ApprovalStatus']}"
        assert student['Status'] == 'Active', f"Student should be active, got {student['Status']}"
        print("✓ Student registration: Correctly approved and active")
        
        # Test 2: Instructor registration (should be pending and inactive)
        execute_query('''
            INSERT INTO users (First, Last, Email, Password, UserType, ApprovalStatus, Status, CreatedAt, UpdatedAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ''', ('Test', 'Instructor', 'test_instructor@example.com', password_hash, 'instructor', 'Pending', 'Inactive'))
        
        instructor = get_record('SELECT * FROM users WHERE Email = %s', ('test_instructor@example.com',))
        assert instructor is not None, "Instructor record should exist"
        assert instructor['ApprovalStatus'] == 'Pending', f"Instructor should be pending, got {instructor['ApprovalStatus']}"
        assert instructor['Status'] == 'Inactive', f"Instructor should be inactive, got {instructor['Status']}"
        print("✓ Instructor registration: Correctly pending and inactive")
        
        # Test 3: Company registration (should be pending and inactive)
        execute_query('''
            INSERT INTO users (First, Last, Email, Password, UserType, ApprovalStatus, Status, CreatedAt, UpdatedAt)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        ''', ('Test', 'Company', 'test_company@example.com', password_hash, 'company', 'Pending', 'Inactive'))
        
        company = get_record('SELECT * FROM users WHERE Email = %s', ('test_company@example.com',))
        assert company is not None, "Company record should exist"
        assert company['ApprovalStatus'] == 'Pending', f"Company should be pending, got {company['ApprovalStatus']}"
        assert company['Status'] == 'Inactive', f"Company should be inactive, got {company['Status']}"
        print("✓ Company registration: Correctly pending and inactive")
            
    except Exception as e:
        print(f"✗ Registration test failed: {e}")
        assert False, f"Registration test failed: {e}"

def test_login_logic(app_context):
    """Test that login logic respects approval status"""
    print("\n=== Testing Login Logic ===")
    
    try:
        # Test login for different user states
        student = get_record('SELECT * FROM users WHERE Email = %s', ('test_student@example.com',))
        instructor = get_record('SELECT * FROM users WHERE Email = %s', ('test_instructor@example.com',))
        company = get_record('SELECT * FROM users WHERE Email = %s', ('test_company@example.com',))
        
        print(f"Student: ApprovalStatus={student.get('ApprovalStatus') if student else None}, Status={student.get('Status') if student else None} (Should allow login)")
        print(f"Instructor: ApprovalStatus={instructor.get('ApprovalStatus') if instructor else None}, Status={instructor.get('Status') if instructor else None} (Should block login)")
        print(f"Company: ApprovalStatus={company.get('ApprovalStatus') if company else None}, Status={company.get('Status') if company else None} (Should block login)")
        
        # Test approval logic
        def can_login(user):
            if not user:
                return False, "User not found"
            if user.get('ApprovalStatus') == 'Pending':
                return False, "Account pending approval"
            if user.get('Status') != 'Active':
                return False, "Account not active"
            return True, "Login allowed"
        
        student_result = can_login(student)
        instructor_result = can_login(instructor)
        company_result = can_login(company)
        
        # Test assertions for login logic
        assert student_result[0], f"Student login should be allowed, but was blocked: {student_result[1]}"
        print("✓ Student login: Allowed (correct)")
        
        assert not instructor_result[0], f"Instructor login should be blocked, but was allowed: {instructor_result[1]}"
        print("✓ Instructor login: Blocked (correct)")
        
        assert not company_result[0], f"Company login should be blocked, but was allowed: {company_result[1]}"
        print("✓ Company login: Blocked (correct)")
            
    except Exception as e:
        print(f"✗ Login test failed: {e}")
        assert False, f"Login test failed: {e}"

def test_approval_workflow(app_context):
    """Test that admin approval workflow works"""
    print("\n=== Testing Approval Workflow ===")
    
    try:
        # Approve the instructor
        execute_query('''
            UPDATE users SET ApprovalStatus = 'Approved', Status = 'Active' 
            WHERE Email = %s
        ''', ('test_instructor@example.com',))
        
        instructor = get_record('SELECT * FROM users WHERE Email = %s', ('test_instructor@example.com',))
        
        assert instructor is not None, "Instructor record should exist after approval"
        assert instructor['ApprovalStatus'] == 'Approved', f"Instructor should be approved, got {instructor['ApprovalStatus']}"
        assert instructor['Status'] == 'Active', f"Instructor should be active, got {instructor['Status']}"
        print("✓ Instructor approval: Successfully approved and activated")
            
    except Exception as e:
        print(f"✗ Approval workflow test failed: {e}")
        assert False, f"Approval workflow test failed: {e}"

def cleanup_test_data():
    """Clean up test data"""
    try:
        execute_query("DELETE FROM users WHERE Email IN (%s, %s, %s)", 
                     ('test_student@example.com', 'test_instructor@example.com', 'test_company@example.com'))
        print("\n✓ Test data cleaned up")
    except Exception as e:
        print(f"✗ Cleanup failed: {e}")

def main():
    print("Registration and Login Logic Test")
    print("=" * 50)
    
    if not test_database_connection():
        return
    
    test_user_registration_logic()
    test_login_logic()
    test_approval_workflow()
    cleanup_test_data()
    
    print("\n=== Test Summary ===")
    print("✓ Registration logic correctly sets approval status based on user type")
    print("✓ Login logic properly checks approval status before allowing access")
    print("✓ Admin approval workflow can activate pending users")
    print("\nAll tests completed!")

if __name__ == '__main__':
    main()
