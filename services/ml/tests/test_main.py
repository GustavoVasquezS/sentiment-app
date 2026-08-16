"""
Suite pytest formal para la API de sentimiento.
Reemplaza al script manual test_api.py (requests contra localhost) por
tests reales con TestClient (in-process, no requiere levantar el server).
"""
import pytest
from fastapi.testclient import TestClient

from main import app, load_model

VALID_SENTIMENTS = {"Negativo", "Neutro", "Positivo"}


@pytest.fixture(scope="module", autouse=True)
def _load_model_once():
    load_model()


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "healthy"
    assert "model_version" in body
    assert 0.0 <= body["threshold"] <= 1.0


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "message" in r.json()


@pytest.mark.parametrize(
    "text",
    [
        "El producto es excelente y llegó rápido, muy recomendado.",
        "Está bien, cumple, nada especial.",
        "No funciona, llegó roto y el soporte no responde.",
        "Produto excelente, entrega rápida e recomendo.",
        "Não funciona, veio quebrado e o suporte não responde.",
    ],
)
def test_predict_single_shape(client, text):
    r = client.post("/predict", json={"text": text})
    assert r.status_code == 200
    body = r.json()
    assert body["prevision"] in VALID_SENTIMENTS
    assert 0.0 <= body["probabilidad"] <= 1.0
    assert isinstance(body["review_required"], bool)


def test_predict_rejects_short_text(client):
    r = client.post("/predict", json={"text": "hi"})
    assert r.status_code == 422  # pydantic min_length


def test_predict_batch_preserves_order_and_length(client):
    texts = [
        "Excelente servicio, muy satisfecho",
        "Normal, nada del otro mundo",
        "Pésimo, no lo recomiendo",
    ]
    r = client.post("/predict/batch", json={"texts": texts})
    assert r.status_code == 200
    results = r.json()["results"]
    assert len(results) == len(texts)
    for result in results:
        assert result["prevision"] in VALID_SENTIMENTS


def test_predict_batch_rejects_over_100(client):
    texts = ["texto de prueba valido"] * 101
    r = client.post("/predict/batch", json={"texts": texts})
    assert r.status_code in (400, 422)
