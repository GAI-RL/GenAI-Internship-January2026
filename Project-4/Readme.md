For first time use:
cd backend
source venv/bin/activate       ||    .\venv\Scripts\Activate
pip install -r requirements.txt
uvicorn app.main:app --reload
http://127.0.0.1:8000/docs