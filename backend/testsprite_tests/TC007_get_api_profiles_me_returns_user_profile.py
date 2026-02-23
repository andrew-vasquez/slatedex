import requests

def test_get_api_profiles_me_returns_user_profile():
    base_url = "http://localhost:3001"
    url = f"{base_url}/api/profiles/me"
    token = "M0fXBpErnyNl10NrWxRtviGGVwGM83Rf"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        # Assert status code
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"

        json_resp = response.json()
        # Basic validations of user profile fields
        assert isinstance(json_resp, dict), "Response is not a JSON object"

        user_profile_keys = ['username', 'bio', 'avatarUrl', 'favoriteGameIds', 'favoritePokemonNames']
        ai_usage_keys = ['chatCount', 'analyzeCount', 'remaining']

        assert any(key in json_resp for key in user_profile_keys), "User profile keys missing from response"

        assert 'aiUsage' in json_resp or any(key in json_resp for key in ai_usage_keys), "AI usage snapshot missing"
        ai_usage_data = json_resp.get('aiUsage')
        if ai_usage_data is None:
            ai_usage_data = json_resp
        
        for key in ai_usage_keys:
            assert key in ai_usage_data, f"AI usage key '{key}' missing"
            assert isinstance(ai_usage_data[key], int), f"AI usage key '{key}' is not an int"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_profiles_me_returns_user_profile()
