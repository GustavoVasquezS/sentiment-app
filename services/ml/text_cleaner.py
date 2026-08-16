"""
Módulo de limpieza de texto para el pipeline de sentimiento.
Esta clase debe coincidir exactamente con la usada en el entrenamiento.
"""

import re
import unicodedata
from sklearn.base import BaseEstimator, TransformerMixin

_noise_re = re.compile(r"(http\S+|www\.\S+|@\w+|#\w+)", re.IGNORECASE)
_space_re = re.compile(r"\s+")


def _keep_char(ch: str) -> bool:
    if ch.isspace():
        return True
    cat = unicodedata.category(ch)
    return cat.startswith(("L", "M")) or cat == "Nd"


def clean_text_unicode(text: str) -> str:
    if text is None:
        return ""
    t = str(text).lower()
    t = _noise_re.sub(" ", t)
    t = "".join(ch if _keep_char(ch) else " " for ch in t)
    t = _space_re.sub(" ", t).strip()
    return t


class TextCleaner(BaseEstimator, TransformerMixin):
    """Limpiador de texto compatible con el pipeline entrenado."""
    def fit(self, X, y=None):
        return self

    def transform(self, X):
        return [clean_text_unicode(x) for x in X]
