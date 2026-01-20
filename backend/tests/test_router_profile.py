from profile_store import profile_store


def test_get_profile_defaults(client, mock_firestore):
    profile_store.clear_local()

    resp = client.get("/profile")

    assert resp.status_code == 200
    body = resp.json()
    assert body["user_id"] == "test_user"
    assert body["bio"] is None
    assert body["wage_per_hour"] is None


def test_update_profile(client, mock_firestore):
    profile_store.clear_local()

    payload = {
        "name": "Alex",
        "bio": "Focused on strength.",
        "wage_per_hour": 55,
    }

    resp = client.post("/profile", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Alex"
    assert data["wage_per_hour"] == 55

    # Profile should be persisted for subsequent reads.
    reread = client.get("/profile")
    assert reread.status_code == 200
    reread_body = reread.json()
    assert reread_body["bio"] == "Focused on strength."

def test_update_profile_rejects_invalid_numbers(client, mock_firestore):
    profile_store.clear_local()

    bad_wage = client.post("/profile", json={"wage_per_hour": -5})
    assert bad_wage.status_code == 400
