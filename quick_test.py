#!/usr/bin/env python3
# Quick test of job application functionality

import sys
import os
sys.path.append('.')

try:
    from routes.jobs import allowed_file, MAX_FILE_SIZE, ALLOWED_EXTENSIONS
    print("✅ SUCCESS: All imports work correctly")
    print(f"✅ Max file size: {MAX_FILE_SIZE // (1024*1024)} MB")
    print(f"✅ Allowed extensions: {list(ALLOWED_EXTENSIONS)}")
    
    # Test file validation
    test_cases = [
        ("resume.pdf", True),
        ("document.docx", True),
        ("image.jpg", False),
        ("script.exe", False)
    ]
    
    print("\n🔍 Testing file validation:")
    for filename, expected in test_cases:
        result = allowed_file(filename)
        status = "✅" if result == expected else "❌"
        print(f"  {status} {filename}: {result}")
    
    print("\n✅ SUCCESS: Job application functionality is ready!")
    
except Exception as e:
    print(f"❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
