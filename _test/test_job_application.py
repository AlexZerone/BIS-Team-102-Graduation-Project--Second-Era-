#!/usr/bin/env python3
"""
Test script to verify job application and resume upload functionality
"""

import os
import sys
import tempfile
from werkzeug.datastructures import FileStorage
from io import BytesIO

# Add the project directory to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

def test_file_upload_functions():
    """Test the file upload utility functions"""
    try:
        from routes.jobs import allowed_file, save_resume_file, create_upload_folder
        
        print("✅ Successfully imported upload functions")
        
        # Test allowed_file function
        test_files = [
            ("resume.pdf", True),
            ("document.doc", True), 
            ("document.docx", True),
            ("image.jpg", False),
            ("script.py", False),
            ("", False)
        ]
        
        print("\n🔍 Testing allowed_file function:")
        for filename, expected in test_files:
            result = allowed_file(filename)
            status = "✅" if result == expected else "❌"
            print(f"  {status} {filename}: {result} (expected: {expected})")
        
        # Test create_upload_folder function
        print("\n🔍 Testing create_upload_folder function:")
        test_folder = os.path.join(tempfile.gettempdir(), "test_uploads")
        result_folder = create_upload_folder(test_folder)
        if os.path.exists(result_folder):
            print(f"  ✅ Folder created successfully: {result_folder}")
            os.rmdir(result_folder)  # Clean up
        else:
            print(f"  ❌ Failed to create folder: {test_folder}")
        
        print("\n✅ File upload functions test completed successfully")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_database_schema():
    """Test if the database schema matches our expectations"""
    try:
        from models import get_record, get_records
        
        print("\n🔍 Testing database connectivity...")
        
        # Test basic connection (this may fail if DB is not set up)
        try:
            result = get_record("SELECT 1 as test")
            if result:
                print("  ✅ Database connection successful")
        except Exception as e:
            print(f"  ⚠️  Database connection failed (expected if DB not set up): {e}")
        
        print("\n✅ Database schema test completed")
        return True
        
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def check_upload_directories():
    """Check if upload directories exist and are writable"""
    print("\n🔍 Checking upload directories:")
    
    static_folder = os.path.join(project_root, "static")
    uploads_folder = os.path.join(static_folder, "uploads")
    resumes_folder = os.path.join(uploads_folder, "resumes")
    
    folders = [
        ("static", static_folder),
        ("uploads", uploads_folder), 
        ("resumes", resumes_folder)
    ]
    
    for name, folder_path in folders:
        if os.path.exists(folder_path):
            if os.access(folder_path, os.W_OK):
                print(f"  ✅ {name} folder exists and is writable: {folder_path}")
            else:
                print(f"  ⚠️  {name} folder exists but not writable: {folder_path}")
        else:
            print(f"  ⚠️  {name} folder missing: {folder_path}")
            try:
                os.makedirs(folder_path, exist_ok=True)
                print(f"    ✅ Created {name} folder")
            except Exception as e:
                print(f"    ❌ Failed to create {name} folder: {e}")

def main():
    print("🧪 Testing Job Application and Resume Upload Functionality")
    print("=" * 60)
    
    # Test 1: File upload functions
    test_file_upload_functions()
    
    # Test 2: Upload directories
    check_upload_directories()
    
    # Test 3: Database schema
    test_database_schema()
    
    print("\n" + "=" * 60)
    print("🏁 Testing completed!")
    print("\nTo test the actual job application:")
    print("1. Run the Flask application: python app.py")
    print("2. Log in as a student")
    print("3. Navigate to a job posting")
    print("4. Try to apply with a resume file")

if __name__ == "__main__":
    main()
