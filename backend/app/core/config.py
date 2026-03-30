import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY_JWT: str = os.getenv("SECRET_KEY_JWT", "dev-secret-key-change-in-production")
ALGORITHM_JWT: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
