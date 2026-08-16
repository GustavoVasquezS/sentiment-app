"""
API de Análisis de Sentimiento - Español/Portugués
FastAPI + scikit-learn (TF-IDF + Logistic Regression calibrado)
"""

import os
import sys
from typing import List, Optional
from contextlib import asynccontextmanager

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ============================================================
# Registrar TextCleaner en __main__ para que joblib pueda deserializarlo
# ============================================================
from text_cleaner import TextCleaner, clean_text_unicode
sys.modules['__main__'].TextCleaner = TextCleaner


# ============================================================
# Esquemas Pydantic
# ============================================================
class PredictRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=2000, description="Texto a analizar")


class PredictBatchRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1, max_length=100, description="Lista de textos")


class PredictResponse(BaseModel):
    prevision: str = Field(..., description="Sentimiento predicho: Negativo, Neutro o Positivo")
    probabilidad: float = Field(..., description="Probabilidad de la predicción")
    review_required: bool = Field(..., description="True si la confianza es baja y requiere revisión")


class PredictBatchResponse(BaseModel):
    results: List[PredictResponse]


class HealthResponse(BaseModel):
    status: str
    model_version: str
    threshold: float


# ============================================================
# Carga del modelo
# ============================================================
MODEL_PATH = os.getenv("MODEL_PATH", "sentiment_bundle_es_pt_v2.joblib")
bundle = None


def load_model():
    global bundle
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Modelo no encontrado: {MODEL_PATH}")
    bundle = joblib.load(MODEL_PATH)
    print(f"✅ Modelo cargado: {bundle['meta'].get('model_version', 'unknown')}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    load_model()
    yield
    # Shutdown (cleanup si fuera necesario)


# ============================================================
# App FastAPI
# ============================================================
app = FastAPI(
    title="Sentiment Analysis API",
    description="API para análisis de sentimiento en español y portugués. Clasifica texto en Negativo, Neutro o Positivo.",
    version="1.0.0",
    lifespan=lifespan,
)

# ============================================================
# Configuración CORS
# ============================================================
# En la arquitectura nueva solo el backend Node (apps/api) llama a este
# servicio directamente, por eso el allowlist es explícito en vez de "*".
_allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:8080").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def predict_single(text: str) -> PredictResponse:
    """Predicción individual (contrato externo)."""
    if len(text.strip()) < 5:
        raise HTTPException(status_code=400, detail="El texto debe tener al menos 5 caracteres")

    model = bundle["model"]
    threshold = bundle["threshold"]

    proba = model.predict_proba([text])[0]
    classes = list(model.classes_)
    idx = int(np.argmax(proba))
    pred = str(classes[idx])
    max_prob = float(proba[idx])

    return PredictResponse(
        prevision=pred,
        probabilidad=round(max_prob, 6),
        review_required=bool(max_prob < threshold),
    )


# ============================================================
# Endpoints
# ============================================================
@app.get("/", tags=["Root"])
async def root():
    """Endpoint raíz con información básica."""
    return {
        "message": "Sentiment Analysis API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health():
    """Health check para Render y monitoreo."""
    if bundle is None:
        raise HTTPException(status_code=503, detail="Modelo no cargado")

    return HealthResponse(
        status="healthy",
        model_version=bundle["meta"].get("model_version", "unknown"),
        threshold=bundle["threshold"],
    )


@app.post("/predict", response_model=PredictResponse, tags=["Prediction"])
async def predict(request: PredictRequest):
    """
    Predice el sentimiento de un texto.
    
    - **text**: Texto en español o portugués (5-2000 caracteres)
    
    Retorna:
    - **prevision**: Negativo, Neutro o Positivo
    - **probabilidad**: Confianza de la predicción (0-1)
    - **review_required**: True si requiere revisión humana
    """
    return predict_single(request.text)


@app.post("/predict/batch", response_model=PredictBatchResponse, tags=["Prediction"])
async def predict_batch(request: PredictBatchRequest):
    """
    Predice el sentimiento de múltiples textos (máx 100).
    
    - **texts**: Lista de textos en español o portugués
    
    Retorna lista de predicciones en el mismo orden.
    """
    if len(request.texts) > 100:
        raise HTTPException(status_code=400, detail="Máximo 100 textos por solicitud")

    results = []
    for text in request.texts:
        try:
            result = predict_single(text)
            results.append(result)
        except HTTPException as e:
            # Para batch, incluimos error como Neutro con review_required
            results.append(PredictResponse(
                prevision="Neutro",
                probabilidad=0.0,
                review_required=True,
            ))

    return PredictBatchResponse(results=results)


# ============================================================
# Ejecución local
# ============================================================
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
