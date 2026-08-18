"""Testes do endpoint de saúde (infra — Fase 1)."""


def test_health_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}
