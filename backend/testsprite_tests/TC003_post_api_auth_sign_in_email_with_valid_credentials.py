import requests

def test_post_api_auth_sign_in_email_with_valid_credentials():
    base_url = "http://localhost:3001"
    url = f"{base_url}/api/auth/sign-in/email"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "email": "user@example.com",
        "password": "validPassword123"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Check for session cookie or JWT token in response
    has_auth_cookie = any(cookie.name.lower() in ("session", "authorization", "auth") for cookie in response.cookies)
    jwt_in_header = False
    auth_header = response.headers.get("Authorization") or response.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        jwt_in_header = True

    assert has_auth_cookie or jwt_in_header, "Response does not contain session cookie or JWT token"

test_post_api_auth_sign_in_email_with_valid_credentials()