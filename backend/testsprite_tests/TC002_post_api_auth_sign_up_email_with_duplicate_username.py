import requests

BASE_URL = "http://localhost:3001"
TIMEOUT = 30

headers = {
    "Content-Type": "application/json"
}

def test_post_api_auth_sign_up_email_with_duplicate_username():
    signup_url = f"{BASE_URL}/api/auth/sign-up/email"
    # First, create a user to ensure the username exists
    user_data = {
        "email": "duplicateuser@example.com",
        "password": "ValidPass123!",
        "username": "duplicateuser"
    }

    try:
        # Create user the first time (no auth header required)
        response1 = requests.post(signup_url, json=user_data, headers=headers, timeout=TIMEOUT)
        assert response1.status_code == 201, f"Setup failed: Expected 201, got {response1.status_code}"
        # Attempt to create user again with the same username
        duplicate_data = {
            "email": "duplicateuser2@example.com",  # different email, same username
            "password": "ValidPass123!",
            "username": "duplicateuser"
        }
        response2 = requests.post(signup_url, json=duplicate_data, headers=headers, timeout=TIMEOUT)

        assert response2.status_code in (400, 409), f"Expected 400 or 409 status code, got {response2.status_code}"
        json_resp = response2.json()
        # Validate error message presence about username taken
        error_message = json_resp.get("error") or json_resp.get("message") or ""
        assert "username" in error_message.lower() and ("taken" in error_message.lower() or "exists" in error_message.lower()), \
            f"Expected validation error about username taken, got: {error_message}"
    finally:
        # Cleanup skipped due to no API
        pass

test_post_api_auth_sign_up_email_with_duplicate_username()
