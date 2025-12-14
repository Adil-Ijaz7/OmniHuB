#!/usr/bin/env python3
"""
OmniHub Backend API Testing Suite
Tests all endpoints with admin and user credentials
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class OmniHubAPITester:
    def __init__(self, base_url="https://omnihub-dev.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.admin_token = None
        self.user_token = None
        self.test_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
        # Admin credentials from env
        self.admin_email = "admin@omnihub.com"
        self.admin_password = "Admin@123"
        
        # Test user credentials
        self.test_user_email = f"testuser_{datetime.now().strftime('%H%M%S')}@test.com"
        self.test_user_password = "TestPass123!"
        self.test_user_name = "Test User"

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append({"name": name, "details": details})

    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, 
                    token: Optional[str] = None, expected_status: int = 200) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {'Content-Type': 'application/json'}
        
        if token:
            headers['Authorization'] = f'Bearer {token}'
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status_code": response.status_code}
            
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.make_request(
            "POST", "/auth/login",
            {"email": self.admin_email, "password": self.admin_password}
        )
        
        if success and "access_token" in response:
            self.admin_token = response["access_token"]
            user_data = response.get("user", {})
            self.log_test("Admin Login", True, 
                         f"Role: {user_data.get('role')}, Credits: {user_data.get('credits')}")
            return True
        else:
            self.log_test("Admin Login", False, str(response))
            return False

    def test_user_registration(self):
        """Test user registration"""
        success, response = self.make_request(
            "POST", "/auth/register",
            {
                "email": self.test_user_email,
                "password": self.test_user_password,
                "name": self.test_user_name
            }
        )
        
        if success and "access_token" in response:
            self.user_token = response["access_token"]
            user_data = response.get("user", {})
            self.test_user_id = user_data.get("id")
            self.log_test("User Registration", True, 
                         f"ID: {self.test_user_id}, Credits: {user_data.get('credits')}")
            return True
        else:
            self.log_test("User Registration", False, str(response))
            return False

    def test_user_login(self):
        """Test user login"""
        success, response = self.make_request(
            "POST", "/auth/login",
            {"email": self.test_user_email, "password": self.test_user_password}
        )
        
        if success and "access_token" in response:
            self.user_token = response["access_token"]
            self.log_test("User Login", True, "Login successful")
            return True
        else:
            self.log_test("User Login", False, str(response))
            return False

    def test_admin_get_users(self):
        """Test admin get all users"""
        success, response = self.make_request(
            "GET", "/admin/users", token=self.admin_token
        )
        
        if success and isinstance(response, list):
            user_count = len(response)
            self.log_test("Admin Get Users", True, f"Found {user_count} users")
            return True
        else:
            self.log_test("Admin Get Users", False, str(response))
            return False

    def test_admin_assign_credits(self):
        """Test admin credit assignment"""
        if not self.test_user_id:
            self.log_test("Admin Assign Credits", False, "No test user ID available")
            return False
            
        success, response = self.make_request(
            "POST", "/admin/credits",
            {
                "user_id": self.test_user_id,
                "amount": 10,
                "reason": "Test credit assignment"
            },
            token=self.admin_token
        )
        
        if success and "new_balance" in response:
            self.log_test("Admin Assign Credits", True, 
                         f"New balance: {response['new_balance']}")
            return True
        else:
            self.log_test("Admin Assign Credits", False, str(response))
            return False

    def test_phone_lookup_insufficient_credits(self):
        """Test phone lookup with insufficient credits (should fail)"""
        # First, let's check current user credits
        success, response = self.make_request(
            "GET", "/auth/me", token=self.user_token
        )
        
        if success:
            current_credits = response.get("credits", 0)
            if current_credits > 0:
                self.log_test("Phone Lookup Insufficient Credits", False, 
                             f"User has {current_credits} credits, expected 0")
                return False
        
        # Try phone lookup with 0 credits
        success, response = self.make_request(
            "POST", "/tools/phone-lookup",
            {"phone": "03001234567"},
            token=self.user_token,
            expected_status=402  # Payment Required
        )
        
        if success:
            self.log_test("Phone Lookup Insufficient Credits", True, 
                         "Correctly blocked with insufficient credits")
            return True
        else:
            self.log_test("Phone Lookup Insufficient Credits", False, str(response))
            return False

    def test_phone_lookup_with_credits(self):
        """Test phone lookup after getting credits"""
        success, response = self.make_request(
            "POST", "/tools/phone-lookup",
            {"phone": "03001234567"},
            token=self.user_token
        )
        
        if success and "credits_used" in response:
            self.log_test("Phone Lookup With Credits", True, 
                         f"Credits used: {response['credits_used']}")
            return True
        else:
            self.log_test("Phone Lookup With Credits", False, str(response))
            return False

    def test_temp_email_generation(self):
        """Test temporary email generation"""
        success, response = self.make_request(
            "POST", "/tools/temp-email",
            {"action": "generate"},
            token=self.user_token
        )
        
        if success and "email" in response:
            self.log_test("Temp Email Generation", True, 
                         f"Generated: {response['email']}")
            return True
        else:
            self.log_test("Temp Email Generation", False, str(response))
            return False

    def test_live_tv_channels(self):
        """Test live TV channels endpoint"""
        success, response = self.make_request(
            "GET", "/tools/live-tv/channels", token=self.user_token
        )
        
        if success and "channels" in response:
            channel_count = len(response["channels"])
            self.log_test("Live TV Channels", True, f"Found {channel_count} channels")
            return True
        else:
            self.log_test("Live TV Channels", False, str(response))
            return False

    def test_usage_history(self):
        """Test user usage history"""
        success, response = self.make_request(
            "GET", "/user/usage-history", token=self.user_token
        )
        
        if success and isinstance(response, list):
            usage_count = len(response)
            self.log_test("Usage History", True, f"Found {usage_count} usage records")
            return True
        else:
            self.log_test("Usage History", False, str(response))
            return False

    def test_admin_usage_logs(self):
        """Test admin usage logs"""
        success, response = self.make_request(
            "GET", "/admin/usage-logs", token=self.admin_token
        )
        
        if success and isinstance(response, list):
            log_count = len(response)
            self.log_test("Admin Usage Logs", True, f"Found {log_count} usage logs")
            return True
        else:
            self.log_test("Admin Usage Logs", False, str(response))
            return False

    def test_admin_credit_logs(self):
        """Test admin credit logs"""
        success, response = self.make_request(
            "GET", "/admin/credit-logs", token=self.admin_token
        )
        
        if success and isinstance(response, list):
            log_count = len(response)
            self.log_test("Admin Credit Logs", True, f"Found {log_count} credit logs")
            return True
        else:
            self.log_test("Admin Credit Logs", False, str(response))
            return False

    def test_eyecon_lookup_not_configured(self):
        """Test Eyecon lookup (should fail due to missing config)"""
        success, response = self.make_request(
            "POST", "/tools/eyecon-lookup",
            {"phone": "03001234567"},
            token=self.user_token,
            expected_status=503  # Service Unavailable
        )
        
        if success:
            self.log_test("Eyecon Lookup Not Configured", True, 
                         "Correctly returns 503 for missing config")
            return True
        else:
            self.log_test("Eyecon Lookup Not Configured", False, str(response))
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting OmniHub API Tests")
        print("=" * 50)
        
        # Authentication tests
        if not self.test_admin_login():
            print("❌ Admin login failed - stopping tests")
            return False
            
        if not self.test_user_registration():
            print("❌ User registration failed - stopping tests")
            return False
            
        # Admin functionality tests
        self.test_admin_get_users()
        
        # Test credit system
        self.test_phone_lookup_insufficient_credits()  # Should fail with 0 credits
        self.test_admin_assign_credits()  # Admin assigns credits
        
        # Tool tests with credits
        self.test_phone_lookup_with_credits()
        self.test_temp_email_generation()
        self.test_live_tv_channels()
        
        # History and logs
        self.test_usage_history()
        self.test_admin_usage_logs()
        self.test_admin_credit_logs()
        
        # Test mocked/unconfigured services
        self.test_eyecon_lookup_not_configured()
        
        # Test user login after registration
        self.test_user_login()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 50)
        print("📊 TEST SUMMARY")
        print("=" * 50)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return len(self.failed_tests) == 0

def main():
    tester = OmniHubAPITester()
    
    try:
        success = tester.run_all_tests()
        all_passed = tester.print_summary()
        
        return 0 if all_passed else 1
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())