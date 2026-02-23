import requests

BASE_URL = "http://localhost:3001/backend"
AUTH_TOKEN = "M0fXBpErnyNl10NrWxRtviGGVwGM83Rf"
HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Accept": "application/json"
}
TIMEOUT = 30

def test_get_api_teams_list_user_teams():
    try:
        response = requests.get(f"{BASE_URL}/api/teams", headers=HEADERS, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to get teams failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert isinstance(data, list), f"Expected response to be a list but got {type(data)}"
    # Additional checks can be done if we know the userId or team ownership inside each team
    for team in data:
        assert isinstance(team, dict), "Each team should be a dictionary"
        assert "id" in team, "Team object must have 'id'"
        assert "name" in team, "Team object must have 'name'"
        assert "pokemon" in team, "Team object must have 'pokemon'"
        # Optionally check that pokemon is list
        assert isinstance(team.get("pokemon"), list), "'pokemon' key should be a list"

test_get_api_teams_list_user_teams()