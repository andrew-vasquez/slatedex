import requests

BASE_URL = "http://localhost:3001/backend"
AUTH_TOKEN = "M0fXBpErnyNl10NrWxRtviGGVwGM83Rf"
HEADERS = {
    "Authorization": f"Bearer {AUTH_TOKEN}",
    "Content-Type": "application/json",
}

def test_post_api_ai_chat_send_valid_message():
    timeout = 30
    team_id = None
    created_team_id = None
    try:
        # Step 1: Create a new team to get a valid teamId
        team_payload = {
            "name": "Test Team TC009",
            "generation": 1,
            "pokemon": [
                {
                    "species": "pikachu",
                    "level": 50,
                    "ability": "static",
                    "moves": ["thunderbolt", "quick attack", "iron tail", "volttackle"],
                    "nature": "jolly",
                    "evs": {"hp": 0, "atk": 252, "def": 0, "spa": 0, "spd": 4, "spe": 252},
                    "ivs": {"hp": 31, "atk": 31, "def": 31, "spa": 31, "spd": 31, "spe": 31}
                }
            ]
        }
        res_create_team = requests.post(
            f"{BASE_URL}/api/teams",
            headers=HEADERS,
            json=team_payload,
            timeout=timeout,
        )
        assert res_create_team.status_code == 201, f"Failed to create team: {res_create_team.text}"
        created_team_id = res_create_team.json().get("id")
        assert created_team_id, "Created team ID missing in response"

        team_id = created_team_id

        # Step 2: Send a valid chat message to the AI coach
        message = "Hello AI coach! This is a test message within 2000 characters."
        chat_payload = {
            "teamId": team_id,
            "message": message,
            # contextOptions can be optional, send empty dict
            "contextOptions": {}
        }
        res_chat = requests.post(
            f"{BASE_URL}/api/ai/chat",
            headers=HEADERS,
            json=chat_payload,
            timeout=timeout,
        )
        assert res_chat.status_code == 200, f"AI chat message failed: {res_chat.text}"
        data = res_chat.json()

        # Validate response contains assistant reply and usage counts
        assert "assistant" in data, "Response missing 'assistant' field"
        assistant_reply = data["assistant"]
        assert isinstance(assistant_reply, str) and assistant_reply.strip() != "", "Assistant reply empty or invalid"

        assert "usage" in data, "Response missing 'usage' field"
        usage = data["usage"]
        assert isinstance(usage, dict), "'usage' field is not a dict"
        # Expected usage fields: chatCount, analyzeCount, remaining or similar
        assert "chatCount" in usage, "'chatCount' missing in usage"
        assert "remaining" in usage, "'remaining' missing in usage"
        assert isinstance(usage["chatCount"], int), "'chatCount' is not int"
        assert isinstance(usage["remaining"], int), "'remaining' is not int"

    finally:
        # Cleanup: Delete created team if exists
        if created_team_id:
            try:
                res_delete = requests.delete(
                    f"{BASE_URL}/api/teams/{created_team_id}",
                    headers=HEADERS,
                    timeout=timeout,
                )
                # Accept 204 No Content or 200 OK as success for delete endpoint
                assert res_delete.status_code in (200, 204), f"Failed to delete team: {res_delete.status_code} {res_delete.text}"
            except Exception as e:
                print(f"Cleanup deletion failed: {e}")

test_post_api_ai_chat_send_valid_message()