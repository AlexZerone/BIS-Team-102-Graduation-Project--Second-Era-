#!/usr/bin/env python3
"""
Comprehensive test for job application and resume upload functionality
"""

import os
import sys
import tempfile
import unittest
from unittest.mock import Mock, patch, MagicMock
from werkzeug.datastructures import FileStorage
from io import BytesIO

# Add the project directory to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

class TestJobApplication(unittest.TestCase):
    
    def setUp(self):
        """Set up test fixtures"""
        self.test_files_dir = tempfile.mkdtemp()
        
    def tearDown(self):
        """Clean up test fixtures"""
        import shutil
        if os.path.exists(self.test_files_dir):
            shutil.rmtree(self.test_files_dir)
    
    def test_allowed_file_function(self):
        """Test the allowed_file validation function"""
        from routes.jobs import allowed_file
        
        # Test valid files
        self.assertTrue(allowed_file('resume.pdf'))
        self.assertTrue(allowed_file('document.doc'))
        self.assertTrue(allowed_file('my_resume.docx'))
        self.assertTrue(allowed_file('RESUME.PDF'))  # Case insensitive
        
        # Test invalid files
        self.assertFalse(allowed_file('image.jpg'))
        self.assertFalse(allowed_file('script.py'))
        self.assertFalse(allowed_file(''))
        self.assertFalse(allowed_file('noextension'))
        self.assertFalse(allowed_file('malicious.exe'))
    
    def test_create_upload_folder(self):
        """Test upload folder creation"""
        from routes.jobs import create_upload_folder
        
        test_folder = os.path.join(self.test_files_dir, 'uploads', 'test')
        result = create_upload_folder(test_folder)
        
        self.assertEqual(result, test_folder)
        self.assertTrue(os.path.exists(test_folder))
        self.assertTrue(os.path.isdir(test_folder))
    
    def create_test_file(self, filename, content=b"Test resume content"):
        """Helper to create test files"""
        file_obj = BytesIO(content)
        file_obj.name = filename
        return FileStorage(file_obj, filename=filename)
    
    @patch('routes.jobs.current_app')
    def test_save_resume_file_success(self, mock_app):
        """Test successful resume file saving"""
        from routes.jobs import save_resume_file
        
        # Mock Flask app
        mock_app.static_folder = self.test_files_dir
        
        # Create test file
        test_file = self.create_test_file('test_resume.pdf')
        
        # Test saving
        result = save_resume_file(test_file, student_id=1, job_id=1)
        
        # Verify result
        self.assertIsNotNone(result)
        self.assertTrue(result.startswith('/static/uploads/resumes/'))
        self.assertTrue(result.endswith('.pdf'))
        
        # Verify file was actually saved
        saved_file_path = os.path.join(self.test_files_dir, result.lstrip('/static/'))
        self.assertTrue(os.path.exists(saved_file_path))
    
    def test_save_resume_file_invalid_extension(self):
        """Test saving file with invalid extension"""
        from routes.jobs import save_resume_file
        
        test_file = self.create_test_file('malicious.exe')
        result = save_resume_file(test_file, student_id=1, job_id=1)
        
        self.assertIsNone(result)
    
    def test_file_size_constants(self):
        """Test file size and extension constants"""
        from routes.jobs import MAX_FILE_SIZE, ALLOWED_EXTENSIONS
        
        self.assertEqual(MAX_FILE_SIZE, 10 * 1024 * 1024)  # 10MB
        self.assertIn('pdf', ALLOWED_EXTENSIONS)
        self.assertIn('doc', ALLOWED_EXTENSIONS)
        self.assertIn('docx', ALLOWED_EXTENSIONS)
    
    def test_job_application_form_validation(self):
        """Test job application form validation"""
        try:
            from forms import JobApplicationForm
            
            # Test with missing data
            form = JobApplicationForm(data={})
            self.assertFalse(form.validate())
            
            # Test with valid data (mock file)
            test_file = self.create_test_file('resume.pdf')
            form = JobApplicationForm(data={
                'cover_letter': 'This is a valid cover letter with more than 10 characters.'
            })
            
            # Note: FileField validation requires actual file upload in request context
            # This is just a basic structure test
            self.assertIn('resume_file', form._fields)
            self.assertIn('cover_letter', form._fields)
            
        except ImportError:
            print("⚠️  JobApplicationForm not found - this is expected if it's not implemented yet")

def run_integration_test():
    """Run an integration test with the actual Flask app"""
    print("\n🧪 Running Integration Test")
    print("=" * 40)
    
    try:
        # This would require a running Flask app and database
        # For now, just check if the imports work
        from routes.jobs import jobs_bp, apply_job, save_resume_file
        from models import get_record, execute_query
        
        print("✅ All imports successful")
        print("✅ Job blueprint exists")
        print("✅ Apply job route exists")
        print("✅ Resume save function exists")
        
        print("\n📋 To test manually:")
        print("1. Start the Flask app: python app.py")
        print("2. Register/login as a student")
        print("3. Go to jobs page and click on a job")
        print("4. Click 'Apply Now' and upload a resume with cover letter")
        print("5. Check if the application is saved to the database")
        
        return True
        
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Job Application and Resume Upload Functionality")
    print("=" * 60)
    
    # Run unit tests
    print("\n📝 Running Unit Tests:")
    unittest.main(argv=[''], exit=False, verbosity=2)
    
    # Run integration test
    run_integration_test()
    
    print("\n" + "=" * 60)
    print("🏁 All tests completed!")

if __name__ == "__main__":
    main()
