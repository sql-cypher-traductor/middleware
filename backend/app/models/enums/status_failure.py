import enum


class FailureStage(str, enum.Enum):
    TRANSLATION = "Traducción"
    EXECUTION = "Ejecución"
