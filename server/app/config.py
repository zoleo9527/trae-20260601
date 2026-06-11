from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "售楼处运营系统 - 来访登记与客户归属"
    database_url: str = "sqlite:///./sales_office.db"
    debug: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
