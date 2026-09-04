from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    db_name: str
    db_user:str
    db_password: str
    db_host: str = "localhost"
    jwt_secret: str
    resend_api_key: str | None = None
    email_from: str | None = None
    backend_url: str = "http://localhost:8000"
    frontend_url: str = "http://localhost:3000"
    
    model_config = SettingsConfigDict(extra="ignore", env_file=".env")
    
settings = Settings()