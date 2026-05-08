"""Backend API tests for Safe Steps marketing website."""
import os
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://safesteps-app.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# -------- Health --------
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"
        assert "Safe Steps" in data.get("message", "")


# -------- Products --------
class TestProducts:
    def test_list_all(self, client):
        r = client.get(f"{API}/products")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 6, f"Expected 6 seeded products, got {len(data)}"
        # No _id leak
        for p in data:
            assert "_id" not in p
            assert "id" in p
            assert "name" in p
            assert "category" in p
            assert "price" in p

    def test_filter_collares(self, client):
        r = client.get(f"{API}/products", params={"category": "collares"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 1
        assert all(p["category"] == "collares" for p in data)

    def test_filter_pulseras(self, client):
        r = client.get(f"{API}/products", params={"category": "pulseras"})
        assert r.status_code == 200
        data = r.json()
        assert all(p["category"] == "pulseras" for p in data)

    def test_filter_todos(self, client):
        r = client.get(f"{API}/products", params={"category": "todos"})
        assert r.status_code == 200
        assert len(r.json()) == 6

    def test_get_by_id_valid(self, client):
        r = client.get(f"{API}/products/prod-collar-aurora")
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == "prod-collar-aurora"
        assert data["name"] == "Collar Aurora"
        assert "_id" not in data

    def test_get_by_id_invalid(self, client):
        r = client.get(f"{API}/products/no-existe-xyz")
        assert r.status_code == 404


# -------- Contact --------
class TestContact:
    created_id = None

    def test_create_valid(self, client):
        payload = {
            "name": "TEST_Maria",
            "email": "TEST_maria@example.com",
            "phone": "+525512345678",
            "subject": "Consulta",
            "message": "Hola, me interesa el collar Aurora.",
        }
        r = client.post(f"{API}/contact", json=payload)
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"]
        assert "id" in data
        assert "created_at" in data
        assert "_id" not in data
        TestContact.created_id = data["id"]

    def test_create_invalid_email(self, client):
        payload = {
            "name": "TEST_Bad",
            "email": "not-an-email",
            "message": "Mensaje válido para test.",
        }
        r = client.post(f"{API}/contact", json=payload)
        assert r.status_code == 422

    def test_create_missing_message(self, client):
        payload = {"name": "TEST_NoMsg", "email": "x@example.com"}
        r = client.post(f"{API}/contact", json=payload)
        assert r.status_code == 422

    def test_list_messages(self, client):
        r = client.get(f"{API}/contact")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        for m in data:
            assert "_id" not in m
            assert "id" in m
        # Verify our created message exists
        ids = [m["id"] for m in data]
        if TestContact.created_id:
            assert TestContact.created_id in ids


# -------- Advisory --------
class TestAdvisory:
    def test_create_advisory(self, client):
        payload = {
            "name": "TEST_Asesoria",
            "email": "TEST_asesoria@example.com",
            "phone": "+525511112222",
            "preferred_date": "2026-02-10",
            "notes": "Quiero asesoría para regalo.",
        }
        r = client.post(f"{API}/advisory", json=payload)
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["email"] == payload["email"]
        assert "id" in data
        assert "_id" not in data

    def test_advisory_invalid_email(self, client):
        r = client.post(f"{API}/advisory", json={"name": "TEST_X", "email": "bad"})
        assert r.status_code == 422
