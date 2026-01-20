from user_profile.store import profile_store


def test_get_profile_defaults(client, mock_firestore):
    profile_store.clear_local()

    resp = client.get("/profile")

    assert resp.status_code == 200
    body = resp.json()
    assert body["user_id"] == "test_user"
    assert body["bio"] is None
    assert body["current_weight_kg"] is None
    assert body["wage_per_hour"] is None


def test_update_profile_and_weight_logging(client, mock_firestore):
    profile_store.clear_local()

    payload = {
        "name": "Alex",
        "bio": "Focused on strength.",
        "current_weight_kg": 82.5,
        "wage_per_hour": 55,
        "weight_date": "2025-01-01",
    }

    resp = client.post("/profile", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "Alex"
    assert data["current_weight_kg"] == 82.5
    assert data["wage_per_hour"] == 55

    # Profile should be persisted for subsequent reads.
    reread = client.get("/profile")
    assert reread.status_code == 200
    reread_body = reread.json()
    assert reread_body["bio"] == "Focused on strength."

    # Weight should be written into analytics history.
    weight_history = client.get("/metrics/weight/history").json()
    assert len(weight_history) == 1
    assert weight_history[0]["weight_kg"] == 82.5
    assert weight_history[0]["date"] == "2025-01-01"


def test_update_profile_rejects_invalid_numbers(client, mock_firestore):
    profile_store.clear_local()

    bad_weight = client.post(
        "/profile", json={"current_weight_kg": -1, "wage_per_hour": 10}
    )
    assert bad_weight.status_code == 400

    bad_wage = client.post("/profile", json={"wage_per_hour": -5})
    assert bad_wage.status_code == 400
