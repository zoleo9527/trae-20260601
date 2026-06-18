import sys
sys.path.insert(0, '/Users/zhangliu/Documents/private/model-test/trae-20260601-5/backend')

from uvicorn import run
from app import app

if __name__ == "__main__":
    run("app:app", host="0.0.0.0", port=8000, reload=True)