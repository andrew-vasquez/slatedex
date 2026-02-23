import requests

def test_put_api_profiles_me_update_bio_within_limit():
    base_url = "http://localhost:3001"
    endpoint = "/api/profiles/me"
    url = base_url + endpoint
    token = "M0fXBpErnyNl10NrWxRtviGGVwGM83Rf"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    bio_text = "A" * 240  # 240 characters bio string

    payload = {
        "bio": bio_text
    }

    try:
        response = requests.put(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        json_response = response.json()
        # Assert updated bio is in response and equals payload bio
        assert "bio" in json_response, "Response JSON does not contain 'bio'"
        assert json_response["bio"] == bio_text, "Bio in response does not match updated bio"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_put_api_profiles_me_update_bio_within_limit()
