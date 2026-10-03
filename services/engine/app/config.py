import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ArcApply Engine"
    version: str = "0.1.0"
    data_dir: Path = Path.home() / ".arcapply"
    db_filename: str = "arcapply.db"
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://arcapply-app.louaycodes.tn",
        "https://arcapply.louaycodes.tn",
    ]
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"

    model_config = SettingsConfigDict(
        env_prefix="ARCAPPLY_",
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        extra="ignore",
    )

    @property
    def effective_groq_api_key(self) -> str:
        return self.groq_api_key or os.getenv("GROQ_API_KEY", "")

    @property
    def effective_groq_model(self) -> str:
        return self.groq_model or os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")

    @property
    def db_path(self) -> Path:
        return self.data_dir / self.db_filename

    @property
    def database_url(self) -> str:
        return f"sqlite:///{self.db_path}"

    def ensure_data_dir(self) -> Path:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        return self.data_dir


settings = Settings()
