#!/usr/bin/env python3
"""
Test script to verify all URL routes used in Post-Login Home.html are working correctly
"""

from app import create_app
from flask import url_for

def test_routes():
    """Test that all routes used in the quick actions can be generated"""
    
    app = create_app()
    with app.test_request_context():
        print("Testing URL generation for all quick action routes...")
        print("=" * 60)
        
        # Student routes
        print("\n🎓 STUDENT ROUTES:")
        try:
            print(f"✅ courses.courses: {url_for('courses.courses')}")
        except Exception as e:
            print(f"❌ courses.courses: {e}")
            
        try:
            print(f"✅ assignments.assignments: {url_for('assignments.assignments')}")
        except Exception as e:
            print(f"❌ assignments.assignments: {e}")
            
        try:
            print(f"✅ jobs.jobs: {url_for('jobs.jobs')}")
        except Exception as e:
            print(f"❌ jobs.jobs: {e}")
            
        try:
            print(f"✅ profile.profile: {url_for('profile.profile')}")
        except Exception as e:
            print(f"❌ profile.profile: {e}")
        
        # Instructor routes
        print("\n👨‍🏫 INSTRUCTOR ROUTES:")
        try:
            print(f"✅ courses.create_course: {url_for('courses.create_course')}")
        except Exception as e:
            print(f"❌ courses.create_course: {e}")
            
        try:
            print(f"✅ assignments.create_assessment: {url_for('assignments.create_assessment')}")
        except Exception as e:
            print(f"❌ assignments.create_assessment: {e}")
            
        try:
            print(f"✅ courses.manage_courses: {url_for('courses.manage_courses')}")
        except Exception as e:
            print(f"❌ courses.manage_courses: {e}")
            
        try:
            print(f"✅ assignments.manage_assignments: {url_for('assignments.manage_assignments')}")
        except Exception as e:
            print(f"❌ assignments.manage_assignments: {e}")
        
        # Company routes
        print("\n🏢 COMPANY ROUTES:")
        try:
            print(f"✅ jobs.create_job: {url_for('jobs.create_job')}")
        except Exception as e:
            print(f"❌ jobs.create_job: {e}")
            
        try:
            print(f"✅ jobs.manage_jobs: {url_for('jobs.manage_jobs')}")
        except Exception as e:
            print(f"❌ jobs.manage_jobs: {e}")
        
        print("\n" + "=" * 60)
        print("URL generation test completed!")

if __name__ == "__main__":
    test_routes()
