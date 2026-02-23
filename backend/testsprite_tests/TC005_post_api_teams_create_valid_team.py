import requests
import uuid

BASE_URL = "http://localhost:3001"
AUTH_TOKEN = "M0fXBpErnyNl10NrWxRtviGGVwGM83Rf"
TIMEOUT = 30

def test_post_api_teams_create_valid_team():
    url = f"{BASE_URL}/api/teams"
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }

    team_name = f"TestTeam-{uuid.uuid4().hex[:8]}"
    payload = {
        "name": team_name,
        "generation": 1,
        "pokemon": [
            {
                "name": "Bulbasaur",
                "speciesId": 1,
                "types": ["Grass", "Poison"],
                "stats": {"hp": 45, "attack": 49, "defense": 49, "specialAttack": 65, "specialDefense": 65, "speed": 45},
                "level": 5,
                "moves": ["Tackle", "Vine Whip"]
            }
        ]
    }

    created_team_id = None
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected status 201, got {response.status_code}"
        data = response.json()
        assert isinstance(data, dict), "Response JSON is not an object"
        assert "id" in data, "Response JSON does not contain 'id'"
        created_team_id = data["id"]
        assert isinstance(created_team_id, str) and len(created_team_id) > 0, "Invalid team ID in response"
    finally:
        if created_team_id:
            delete_url = f"{BASE_URL}/api/teams/{created_team_id}"
            try:
                del_response = requests.delete(delete_url, headers=headers, timeout=TIMEOUT)
                assert del_response.status_code == 204, f"Expected 204 on delete, got {del_response.status_code}"
            except Exception as e:
                print(f"Cleanup failed to delete created team {created_team_id}: {e}")

test_post_api_teams_create_valid_team()