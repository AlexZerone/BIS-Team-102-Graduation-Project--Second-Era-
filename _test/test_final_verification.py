#!/usr/bin/env python3
"""
Final verification test for all completed fixes:
1. Admin approval functionality (CSRF tokens)
2. Job application functionality (database schema)
"""

import sys
import os
sys.path.append('.')

def test_admin_csrf_fix():
    """Test that admin approval templates have CSRF tokens"""
    print("🔍 Testing admin CSRF token fix...")
    
    # Check instructor template
    instructor_template_path = "templates/admin/pending_instructors.html"
    try:
        with open(instructor_template_path, 'r', encoding='utf-8') as f:
            content = f.read()
            csrf_count = content.count('{{ csrf_token() }}')
            if csrf_count >= 2:
                print(f"✅ Instructor template: {csrf_count} CSRF tokens found")
                return True
            else:
                print(f"❌ Instructor template: Only {csrf_count} CSRF tokens found")
                return False
    except Exception as e:
        print(f"❌ Error reading instructor template: {e}")
        return False

def test_company_csrf_fix():
    """Test that company approval templates have CSRF tokens"""
    # Check company template
    company_template_path = "templates/admin/pending_companies.html"
    try:
        with open(company_template_path, 'r', encoding='utf-8') as f:
            content = f.read()
            csrf_count = content.count('{{ csrf_token() }}')
            if csrf_count >= 2:
                print(f"✅ Company template: {csrf_count} CSRF tokens found")
                return True
            else:
                print(f"❌ Company template: Only {csrf_count} CSRF tokens found")
                return False
    except Exception as e:
        print(f"❌ Error reading company template: {e}")
        return False

def test_job_application_fix():
    """Test the job application database schema fix"""
    print("\n🔍 Testing job application database fix...")
    
    try:
        from app import create_app
        from models import get_record
        from routes.jobs import check_job_prerequisites
        
        app = create_app()
        with app.app_context():
            # Test job query with corrected columns
            job = get_record('''
                SELECT j.JobID, j.Title, j.Requirements, j.RequiredCourses, 
                       j.StructuredRequirements, j.ExperienceLevel, j.Location,
                       c.Industry, c.Name as CompanyName
                FROM jobs j
                JOIN companies c ON j.CompanyID = c.CompanyID
                LIMIT 1
            ''')
            
            if not job:
                print("⚠️  No jobs found for testing")
                return False
                
            print(f"✅ Job query successful: {job['Title']}")
            
            # Test prerequisite check
            student = get_record('SELECT StudentID FROM students LIMIT 1')
            if student:
                result = check_job_prerequisites(job['JobID'], student['StudentID'])
                if 'eligible' in result:
                    print(f"✅ Prerequisite check successful: Eligible = {result['eligible']}")
                    return True
                else:
                    print("❌ Prerequisite check returned invalid result")
                    return False
            else:
                print("⚠️  No students found for testing")
                return False
                
    except Exception as e:
        print(f"❌ Job application test failed: {e}")
        return False

def main():
    """Run all verification tests"""
    print("🎯 FINAL VERIFICATION TEST - ALL COMPLETED FIXES")
    print("=" * 60)
    
    # Test 1: Admin CSRF fixes
    print("\n1. Testing Admin Approval CSRF Token Fix...")
    csrf_instructor = test_admin_csrf_fix()
    csrf_company = test_company_csrf_fix()
    
    # Test 2: Job application database fix
    print("\n2. Testing Job Application Database Schema Fix...")
    job_fix = test_job_application_fix()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 FINAL TEST RESULTS")
    print("=" * 60)
    
    total_tests = 3
    passed_tests = sum([csrf_instructor, csrf_company, job_fix])
    
    print(f"✅ Admin Instructor CSRF: {'PASSED' if csrf_instructor else 'FAILED'}")
    print(f"✅ Admin Company CSRF: {'PASSED' if csrf_company else 'FAILED'}")
    print(f"✅ Job Application DB Fix: {'PASSED' if job_fix else 'FAILED'}")
    print(f"\n🎯 OVERALL RESULT: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL FIXES VERIFIED SUCCESSFULLY!")
        print("✅ Admin approval functionality is fixed (CSRF tokens added)")
        print("✅ Job application functionality is fixed (database schema corrected)")
        print("\n🚀 The system is ready for production use!")
        return True
    else:
        print(f"\n❌ {total_tests - passed_tests} test(s) failed. Please review the issues above.")
        return False

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
