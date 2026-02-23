import requests

def test_post_api_auth_sign_in_email_with_invalid_credentials():
    url = "http://localhost:3001/api/auth/sign-in/email"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "email": "invaliduser@example.com",
        "password": "wrongpassword123"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"

test_post_api_auth_sign_in_email_with_invalid_credentials()