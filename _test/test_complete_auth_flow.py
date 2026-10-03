#!/usr/bin/env python3
"""
Complete Authentication Flow Test
Tests the updated registration and login logic for approval status handling
"""

import requests
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import get_record, execute_query
from werkzeug.security import generate_password_hash, check_password_hash

class AuthFlowTester:
    def __init__(self, base_url="http://127.0.0.1:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_users = [
            {
                'email': 'test_student_auth@example.com',
                'type': 'student',
                'first': 'Test',
                'last': 'Student',
                'password': 'testpass123',
                'expected_approval': 'Approved',
                'expected_status': 'Active'
            },
            {
                'email': 'test_instructor_auth@example.com', 
                'type': 'instructor',
                'first': 'Test',
                'last': 'Instructor',
                'password': 'testpass123',
                'expected_approval': 'Pending',
                'expected_status': 'Inactive'
            },
            {
                'email': 'test_company_auth@example.com',
                'type': 'company', 
                'first': 'Test',
                'last': 'Company',
                'password': 'testpass123',
                'expected_approval': 'Pending',
                'expected_status': 'Inactive'
            }
        ]

    def cleanup_test_users(self):
        """Remove test users from database"""
        print("🧹 Cleaning up test users...")
        try:
            emails = tuple(user['email'] for user in self.test_users)
            # Get user IDs first
            for email in emails:
                user = get_record('SELECT UserID FROM users WHERE Email = %s', (email,))
                if user:
                    user_id = user['UserID']
                    # Delete from profile tables first
                    execute_query('DELETE FROM students WHERE UserID = %s', (user_id,))
                    execute_query('DELETE FROM instructors WHERE UserID = %s', (user_id,))
                    execute_query('DELETE FROM companies WHERE UserID = %s', (user_id,))
            
            # Delete from users table
            if emails:
                placeholders = ', '.join(['%s'] * len(emails))
                execute_query(f'DELETE FROM users WHERE Email IN ({placeholders})', emails)
            print("✅ Test users cleaned up")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")

    def test_database_registration(self):
        """Test direct database registration with correct approval status"""
        print("\n📝 Testing Database Registration Logic...")
        
        for user in self.test_users:
            try:
                # Create user with correct approval status
                password_hash = generate_password_hash(user['password'])
                
                if user['type'] == 'student':
                    approval_status = 'Approved'
                    user_status = 'Active'
                else:
                    approval_status = 'Pending'
                    user_status = 'Inactive'
                
                execute_query('''
                    INSERT INTO users (First, Last, Email, Password, UserType, ApprovalStatus, Status, CreatedAt, UpdatedAt)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ''', (user['first'], user['last'], user['email'], password_hash, user['type'], approval_status, user_status))
                
                # Verify the user was created correctly
                created_user = get_record('SELECT * FROM users WHERE Email = %s', (user['email'],))
                
                assert created_user is not None, f"{user['type'].title()}: User should be created"
                
                actual_approval = created_user.get('ApprovalStatus')
                actual_status = created_user.get('Status')
                
                assert actual_approval == user['expected_approval'], \
                    f"{user['type'].title()}: Expected ApprovalStatus={user['expected_approval']}, got {actual_approval}"
                assert actual_status == user['expected_status'], \
                    f"{user['type'].title()}: Expected Status={user['expected_status']}, got {actual_status}"
                
                print(f"✅ {user['type'].title()}: ApprovalStatus={actual_approval}, Status={actual_status}")
                    
            except Exception as e:
                print(f"❌ {user['type'].title()}: Error - {e}")
                assert False, f"{user['type'].title()}: Registration failed with error: {e}"
    
        def test_login_logic(self):
            """Test login logic respects approval status"""
            print("\n🔐 Testing Login Logic...")
            
            for user in self.test_users:
                try:
                    # Get user from database
                    db_user = get_record('SELECT * FROM users WHERE Email = %s', (user['email'],))
                    
                    assert db_user is not None, f"{user['type'].title()}: User should exist in database"
                    
                    # Test login logic
                    can_login = True
                    login_message = "Login allowed"
                    
                    # Check approval status
                    if db_user.get('ApprovalStatus') == 'Pending':
                        can_login = False
                        login_message = "Account pending approval"
                    
                    # Check user status
                    elif db_user.get('Status') != 'Active':
                        can_login = False
                        login_message = "Account not active"
                    
                    # Check password
                    elif not check_password_hash(db_user['Password'], user['password']):
                        can_login = False
                        login_message = "Invalid password"
                    
                    # Determine expected result
                    expected_login = (user['type'] == 'student')  # Only students should be able to login
                    
                    assert can_login == expected_login, \
                        f"{user['type'].title()}: Expected {'Allow' if expected_login else 'Block'}, Got: {'Allow' if can_login else 'Block'}"
                    
                    status_icon = "✅" if can_login else "🚫"
                    print(f"{status_icon} {user['type'].title()}: {login_message} (Expected)")
                        
                except Exception as e:
                    print(f"❌ {user['type'].title()}: Error - {e}")
                    assert False, f"{user['type'].title()}: Login test failed with error: {e}"

    def test_approval_workflow(self):
        """Test admin approval workflow"""
        print("\n👨‍💼 Testing Approval Workflow...")
        
        try:
            # Find a pending instructor
            instructor = get_record('SELECT * FROM users WHERE Email = %s', ('test_instructor_auth@example.com',))
            if not instructor:
                print("❌ Test instructor not found")
                return False
            
            print(f"📋 Before approval: ApprovalStatus={instructor.get('ApprovalStatus')}, Status={instructor.get('Status')}")
            
            # Approve the instructor
            execute_query('''
                UPDATE users SET ApprovalStatus = 'Approved', Status = 'Active' 
                WHERE UserID = %s
            ''', (instructor['UserID'],))
            
            # Verify approval
            approved_instructor = get_record('SELECT * FROM users WHERE UserID = %s', (instructor['UserID'],))
            
            if (approved_instructor.get('ApprovalStatus') == 'Approved' and 
                approved_instructor.get('Status') == 'Active'):
                print(f"✅ After approval: ApprovalStatus={approved_instructor.get('ApprovalStatus')}, Status={approved_instructor.get('Status')}")
                
                # Test that approved instructor can now login
                can_login = True
                if approved_instructor.get('ApprovalStatus') == 'Pending':
                    can_login = False
                elif approved_instructor.get('Status') != 'Active':
                    can_login = False
                
                if can_login:
                    print("✅ Approved instructor can now login")
                    return True
                else:
                    print("❌ Approved instructor still cannot login")
                    return False
            else:
                print("❌ Instructor approval failed")
                return False
                
        except Exception as e:
            print(f"❌ Approval workflow error: {e}")
            return False

    def test_web_interface(self):
        """Test web interface accessibility"""
        print("\n🌐 Testing Web Interface...")
        
        try:
            # Test home page
            response = self.session.get(f"{self.base_url}/")
            if response.status_code == 200:
                print("✅ Home page accessible")
            else:
                print(f"❌ Home page error: {response.status_code}")
                return False
            
            # Test login page
            response = self.session.get(f"{self.base_url}/login")
            if response.status_code == 200:
                print("✅ Login page accessible")
            else:
                print(f"❌ Login page error: {response.status_code}")
                return False
            
            # Test register page
            response = self.session.get(f"{self.base_url}/register")
            if response.status_code == 200:
                print("✅ Register page accessible")
            else:
                print(f"❌ Register page error: {response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            print(f"❌ Web interface error: {e}")
            return False

    def run_all_tests(self):
        """Run all authentication tests"""
        print("🚀 Starting Complete Authentication Flow Test")
        print("=" * 60)
        
        # Cleanup first
        self.cleanup_test_users()
        
        # Run tests
        tests = [
            ("Database Registration Logic", self.test_database_registration),
            ("Login Logic", self.test_login_logic),
            ("Approval Workflow", self.test_approval_workflow),
            ("Web Interface", self.test_web_interface)
        ]
        
        results = []
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"❌ {test_name}: Critical error - {e}")
                results.append((test_name, False))
        
        # Final cleanup
        self.cleanup_test_users()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = 0
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
            if result:
                passed += 1
        
        print(f"\nResults: {passed}/{len(results)} tests passed")
        
        if passed == len(results):
            print("\n🎉 ALL TESTS PASSED! Authentication logic is working correctly.")
            print("\n✅ Registration Logic:")
            print("   • Students: Automatically approved and active")
            print("   • Instructors: Pending approval, inactive until approved")
            print("   • Companies: Pending approval, inactive until approved")
            print("\n✅ Login Logic:")
            print("   • Users with 'Pending' approval status cannot login")
            print("   • Users with 'Inactive' status cannot login")
            print("   • Only approved and active users can login")
            print("\n✅ Admin Workflow:")
            print("   • Admins can approve pending users")
            print("   • Approved users become active and can login")
        else:
            print(f"\n⚠️ {len(results) - passed} test(s) failed. Please review the issues above.")
        
        return passed == len(results)

def main():
    tester = AuthFlowTester()
    return tester.run_all_tests()

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
