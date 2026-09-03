from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    db_name: str
    db_user:str
    db_password: str
    db_host: str = "localhost"
    jwt_secret: str
    
    model_config = SettingsConfigDict(extra="ignore",env_file=".env ")
    
settings = Settings()