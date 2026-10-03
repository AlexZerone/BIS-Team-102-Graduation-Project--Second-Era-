#!/usr/bin/env python3
"""
Simple test to verify job application database fix
"""

import sys
import os
sys.path.append('.')

def test_job_application_fix():
    """Test the job application database schema fix"""
    try:
        from app import create_app
        from models import get_record
        
        app = create_app()
        with app.app_context():
            print("🔍 Testing job application database fix...")
            
            # Test 1: Check if jobs exist
            job_count = get_record('SELECT COUNT(*) as count FROM jobs')
            print(f"📊 Found {job_count['count']} jobs in database")
            
            # Test 2: Test the fixed query
            job = get_record('''
                SELECT j.JobID, j.Title, j.Requirements, j.RequiredCourses, 
                       j.StructuredRequirements, j.ExperienceLevel, j.Location,
                       c.Industry, c.Name as CompanyName
                FROM jobs j
                JOIN companies c ON j.CompanyID = c.CompanyID
                LIMIT 1
            ''')
            
            if job:
                print("✅ Fixed job query works successfully!")
                print(f"   Job: {job['Title']}")
                print(f"   Company: {job['CompanyName']}")
                print(f"   Industry: {job['Industry']}")
                
                # Test 3: Test the prerequisite check function
                try:
                    from routes.jobs import check_job_prerequisites
                    
                    # Get a student to test with
                    student = get_record('SELECT StudentID FROM students LIMIT 1')
                    if student:
                        result = check_job_prerequisites(job['JobID'], student['StudentID'])
                        print("✅ Prerequisite check function works!")
                        print(f"   Eligible: {result.get('eligible', 'N/A')}")
                        if not result.get('eligible'):
                            print(f"   Reason: {result.get('reason', 'N/A')}")
                    else:
                        print("⚠️  No students found for testing prerequisite check")
                        
                except Exception as e:
                    print(f"❌ Prerequisite check failed: {e}")
                    return False
                    
            else:
                print("⚠️  No jobs found in database")
                return False
                
            print("\n🎉 Job application database schema fix completed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_job_application_fix()
    sys.exit(0 if success else 1)
