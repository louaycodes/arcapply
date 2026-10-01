import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.adapters.database import init_db


@pytest.fixture(autouse=True)
def ensure_db():
    init_db()


def test_playbook_get_default_rules():
    client = TestClient(app)
    # Login louay
    token = client.post("/api/auth/login", json={"username": "louay", "password": "louay"}).json()["token"]

    res = client.get("/api/agent/playbook", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    rules = res.json()
    assert len(rules) >= 3
    titles = [r["title"] for r in rules]
    assert "Focalisation DevOps & Cloud" in titles


def test_playbook_create_and_update_and_delete_rule():
    client = TestClient(app)
    token = client.post("/api/auth/login", json={"username": "louay", "password": "louay"}).json()["token"]

    # 1. Create rule
    create_res = client.post(
        "/api/agent/playbook",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Règle Startups IA",
            "category": "ai",
            "condition_trigger": "Offre provenant d'une startup IA ou GenAI",
            "action_instruction": "Mentionner l'expérience avec les LLMs et les architectures RAG.",
            "is_active": True,
        },
    )
    assert create_res.status_code == 200
    rule = create_res.json()
    rule_id = rule["id"]
    assert rule["title"] == "Règle Startups IA"

    # 2. Update rule
    update_res = client.put(
        f"/api/agent/playbook/{rule_id}",
        headers={"Authorization": f"Bearer {token}"},
        json={"title": "Règle Startups IA & Agents", "is_active": False},
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["title"] == "Règle Startups IA & Agents"
    assert updated["is_active"] is False

    # 3. Delete rule
    del_res = client.delete(f"/api/agent/playbook/{rule_id}", headers={"Authorization": f"Bearer {token}"})
    assert del_res.status_code == 200

    # Verify deleted
    rules = client.get("/api/agent/playbook", headers={"Authorization": f"Bearer {token}"}).json()
    assert not any(r["id"] == rule_id for r in rules)
