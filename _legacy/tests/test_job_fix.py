#!/usr/bin/env python3
"""
Test script to verify the job application database schema fix
"""

from app import create_app
from models import get_record
import sys

def test_job_query():
    """Test the fixed job query"""
    app = create_app()
    with app.app_context():
        try:
            # Test the job detail query that was failing
            job = get_record('''
                SELECT j.JobID, j.Title, j.Requirements, j.RequiredCourses, 
                       j.StructuredRequirements, j.ExperienceLevel, j.Location,
                       c.Industry, c.Name as CompanyName
                FROM jobs j
                JOIN companies c ON j.CompanyID = c.CompanyID
                WHERE j.JobID = %s
            ''', (1,))
            
            if job:
                print('✅ Job query successful!')
                print(f'Job ID: {job["JobID"]}')
                print(f'Title: {job["Title"]}')  
                print(f'Company: {job["CompanyName"]}')
                print(f'Industry: {job["Industry"]}')
                print(f'Location: {job["Location"]}')
                print('✅ Database schema fix applied successfully!')
                return True
            else:
                print('⚠️  No job found with ID 1')
                return False
        except Exception as e:
            print(f'❌ Error: {e}')
            return False

def test_prerequisite_check():
    """Test the check_job_prerequisites function"""
    app = create_app()
    with app.app_context():
        try:
            from routes.jobs import check_job_prerequisites
            
            # Test prerequisite check with a valid student ID
            student = get_record('SELECT StudentID FROM students LIMIT 1')
            if student:
                result = check_job_prerequisites(1, student['StudentID'])
                print('✅ Prerequisite check function works!')
                print(f'Eligible: {result.get("eligible", "N/A")}')
                print(f'Reason: {result.get("reason", "N/A")}')
                return True
            else:
                print('⚠️  No student found for testing')
                return False
        except Exception as e:
            print(f'❌ Prerequisite check error: {e}')
            return False

if __name__ == '__main__':
    print("🔍 Testing Job Application Database Schema Fix...")
    print("=" * 50)
    
    # Test 1: Job query
    print("\n1. Testing job query...")
    test1_passed = test_job_query()
    
    # Test 2: Prerequisite check
    print("\n2. Testing prerequisite check function...")
    test2_passed = test_prerequisite_check()
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    if test1_passed and test2_passed:
        print("🎉 All tests passed! Job application functionality is fixed.")
        sys.exit(0)
    else:
        print("❌ Some tests failed. Check the errors above.")
        sys.exit(1)
