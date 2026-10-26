"""Testes do endpoint de saúde (infra — Fase 1)."""


def test_health_ok(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_get_db_abre_e_fecha_a_sessao_do_banco(monkeypatch):
    from app import database

    class SessaoFalsa:
        fechada = False

        def close(self):
            self.fechada = True

    sessao = SessaoFalsa()
    monkeypatch.setattr(database, "SessionLocal", lambda: sessao)

    gerador = database.get_db()
    assert next(gerador) is sessao
    assert not sessao.fechada
    gerador.close()

    assert sessao.fechada
