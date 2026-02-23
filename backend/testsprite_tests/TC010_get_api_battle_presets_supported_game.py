import requests

def test_get_api_battle_presets_supported_game():
    base_url = "http://localhost:3001/backend"
    token = "M0fXBpErnyNl10NrWxRtviGGVwGM83Rf"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "gen": 3,
        "gameId": "hoenn"
    }
    try:
        response = requests.get(f"{base_url}/api/battle/presets", headers=headers, params=params, timeout=30)
        assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
        data = response.json()
        assert "supported" in data, "Missing 'supported' field in response"
        assert data["supported"] is True, "'supported' field is not True for supported game"
        assert "presets" in data, "Missing 'presets' field in response"
        presets = data["presets"]
        for key in ("gym", "elite4", "champion"):
            assert key in presets, f"Missing preset for {key}"
            assert isinstance(presets[key], list), f"Preset {key} should be a list"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_battle_presets_supported_game()