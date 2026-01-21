class TranslationError(Exception):
    """Excepción base para errores de traducción."""

    pass


class UnsupportedStatementError(TranslationError):
    """Excepción exclusiva para sentencias no soportadas por el sistema."""

    pass
