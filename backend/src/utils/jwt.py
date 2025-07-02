from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
import os


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expiry = os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", 600)
    secret_key = os.environ.get("SECRET_KEY", "secret")

    expire = datetime.now(timezone.utc) + timedelta(minutes=int(expiry))

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, secret_key, algorithm="HS256")
    return encoded_jwt

def decode_token(token: str):
    secret_key = os.environ.get("SECRET_KEY", "secret")
    try:
        payload = jwt.decode(token, secret_key, algorithms=["HS256"])
        return payload  # contains 'sub', 'exp', etc.
    except JWTError:
        return None

