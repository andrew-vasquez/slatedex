import requests
import uuid

BASE_URL = "http://localhost:3001/backend"
TIMEOUT = 30

def test_post_api_auth_sign_up_email_with_valid_data():
    url = f"{BASE_URL}/api/auth/sign-up/email"
    headers = {
        "Content-Type": "application/json"
    }
    unique_suffix = str(uuid.uuid4()).replace("-", "")[:8]
    payload = {
        "email": f"testuser_{unique_suffix}@example.com",
        "password": "ValidPass123!",
        "username": f"testuser{unique_suffix}"
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"

    cookie_names = response.cookies.keys()
    has_session_cookie = any(cookie.lower().find("session") != -1 or cookie.lower().find("jwt") != -1 for cookie in cookie_names)
    
    try:
        resp_json = response.json()
    except ValueError:
        resp_json = {}

    has_token_in_body = False
    if isinstance(resp_json, dict):
        for key in ["token", "jwt", "accessToken", "sessionToken"]:
            if key in resp_json and isinstance(resp_json[key], str) and len(resp_json[key]) > 10:
                has_token_in_body = True
                break

    assert has_session_cookie or has_token_in_body, "No session cookie or JWT/token found in response"

test_post_api_auth_sign_up_email_with_valid_data()
