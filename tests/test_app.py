from fastapi.testclient import TestClient
import copy

from src.app import app, activities


client = TestClient(app)


def setup_function():
    # reset in-memory activities before each test
    global _orig_activities
    if '_orig_activities' not in globals():
        _orig_activities = copy.deepcopy(activities)
    activities.clear()
    activities.update(copy.deepcopy(_orig_activities))


def test_get_activities():
    resp = client.get('/activities')
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert 'Chess Club' in data


def test_signup_and_presence():
    email = 'tester@mergington.edu'
    resp = client.post(f"/activities/Chess%20Club/signup?email={email}")
    assert resp.status_code == 200
    assert email in activities['Chess Club']['participants']


def test_remove_participant():
    email = 'tester-remove@mergington.edu'
    # ensure the participant exists first
    activities['Chess Club']['participants'].append(email)
    resp = client.delete(f"/activities/Chess%20Club/participant?email={email}")
    assert resp.status_code == 200
    assert email not in activities['Chess Club']['participants']
