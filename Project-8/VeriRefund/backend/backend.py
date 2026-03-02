import json
import torch
import torch.nn.functional as F
from transformers import RobertaTokenizer, RobertaForSequenceClassification
from lime.lime_text import LimeTextExplainer
from fastapi import FastAPI, HTTPException, Query, Header
from pydantic import BaseModel
from typing import Optional
import pymysql
import bcrypt
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# -------------------------------
# 1️⃣ Device & Model Setup
# -------------------------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
model = RobertaForSequenceClassification.from_pretrained("models/roberta_human_ai_model")
model.to(device)
model.eval()

class_names = ["Human Review", "AI Review"]
explainer = LimeTextExplainer(class_names=class_names)

# -------------------------------
# 2️⃣ FastAPI App
# -------------------------------
app = FastAPI(title="AI Shopping Review Checker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# 3️⃣ Database Connection Function
# -------------------------------
def get_db_connection():
    """Create a new database connection for each request"""
    try:
        connection = pymysql.connect(
            host="localhost",
            user="root",
            password="",
            database="shopping_ai",
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True
        )
        return connection
    except pymysql.Error as e:
        print(f"Database connection error: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

# -------------------------------
# 4️⃣ Pydantic Models
# -------------------------------
class ProductRequest(BaseModel):
    name: str
    price: float
    description: str
    image: str

class ReviewRequest(BaseModel):
    product_id: int
    review: str

class AuthRequest(BaseModel):
    username: str
    password: str

# -------------------------------
# 5️⃣ Password Hashing
# -------------------------------
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# -------------------------------
# 6️⃣ Model Prediction Functions
# -------------------------------
def model_predict_batch(texts):
    inputs = tokenizer(texts, return_tensors="pt", padding=True, truncation=True, max_length=256)
    with torch.no_grad():
        outputs = model(input_ids=inputs["input_ids"].to(device),
                        attention_mask=inputs["attention_mask"].to(device))
        probs = F.softmax(outputs.logits, dim=1)
    return probs.cpu().numpy()

def predict_review(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=256)
    with torch.no_grad():
        outputs = model(input_ids=inputs["input_ids"].to(device),
                        attention_mask=inputs["attention_mask"].to(device))
        probs = F.softmax(outputs.logits, dim=1)[0]
    pred_class = class_names[torch.argmax(probs).item()]
    return pred_class, float(probs[1]), float(probs[0]), max(float(probs[0]), float(probs[1]))

def generate_lime(text):
    try:
        exp = explainer.explain_instance(text, model_predict_batch, num_features=5, num_samples=50)
        return dict(exp.as_list())
    except:
        return {}

# -------------------------------
# 7️⃣ User Signup/Login
# -------------------------------
@app.post("/signup")
def signup(request: AuthRequest):
    connection = None
    try:
        if not request.username or not request.password:
            raise HTTPException(status_code=400, detail="Username and password required")
        
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE username=%s", (request.username,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Username already exists")
            
            hashed = hash_password(request.password)
            cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", 
                          (request.username, hashed))
            
            return {"message": "User created successfully", "username": request.username, "success": True}
    finally:
        if connection:
            connection.close()

@app.post("/login")
def login(request: AuthRequest):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, username, password FROM users WHERE username=%s", 
                          (request.username,))
            user = cursor.fetchone()
            
            if not user or not verify_password(request.password, user["password"]):
                raise HTTPException(status_code=401, detail="Invalid credentials")
            
            return {"user_id": user["id"], "username": user["username"], "success": True}
    finally:
        if connection:
            connection.close()

# -------------------------------
# 8️⃣ Admin Login (Hardcoded)
# -------------------------------
@app.post("/admin/login")
def admin_login(request: AuthRequest):
    if request.username == "admin" and request.password == "admin123":
        return {"username": "admin", "is_admin": True, "success": True}
    raise HTTPException(status_code=401, detail="Invalid admin credentials")

# -------------------------------
# 9️⃣ Admin Add Product
# -------------------------------
@app.post("/admin/add_product")
def add_product(request: ProductRequest, is_admin: str = Header(None, alias="is-admin")):
    if is_admin != "true":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                "INSERT INTO products (name, price, description, image) VALUES (%s,%s,%s,%s)",
                (request.name.strip(), request.price, request.description, request.image)
            )
            return {"message": "Product added successfully", "product_id": cursor.lastrowid}
    finally:
        if connection:
            connection.close()

# -------------------------------
# 🔟 User Add Review
# -------------------------------
@app.post("/reviews")
def add_review(request: ReviewRequest, current_user_id: int = Header(..., alias="X-User-Id")):
    pred_class, prob_ai, prob_human, confidence = predict_review(request.review)
    lime_exp = generate_lime(request.review)
    
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                """INSERT INTO reviews (product_id, user_id, text, predicted_class, prob_ai, prob_human, confidence, lime_explanation, status)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (request.product_id, current_user_id, request.review.strip(),
                 pred_class, prob_ai, prob_human, confidence, json.dumps(lime_exp), "approved")
            )
            return {"message": "Review submitted successfully"}
    finally:
        if connection:
            connection.close()

# -------------------------------
# 1️⃣1️⃣ Get Product Reviews (hide prediction for author)
# -------------------------------
@app.get("/products/{product_id}/reviews")
def get_reviews(
    product_id: int, 
    current_user_id: Optional[int] = Header(None, alias="X-User-Id"),
    is_admin: Optional[str] = Header(None, alias="is-admin")
):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute(
                """SELECT id, user_id, text, predicted_class, confidence, created_at 
                   FROM reviews 
                   WHERE product_id=%s 
                   ORDER BY created_at DESC""",
                (product_id,)
            )
            reviews = cursor.fetchall()
            
            # Only hide prediction for non-admin users viewing their own reviews
            if is_admin != "true":  # If NOT admin
                for r in reviews:
                    if current_user_id and r["user_id"] == current_user_id:
                        r["predicted_class"] = None
                        r["confidence"] = None
            
            return reviews
    finally:
        if connection:
            connection.close()

# -------------------------------
# 1️⃣2️⃣ Admin View All Reviews
# -------------------------------
@app.get("/admin/reviews")
def admin_reviews(filter_class: Optional[str] = Query(None), is_admin: str = Header(None, alias="is-admin")):
    if is_admin != "true":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            if filter_class and filter_class in class_names:
                cursor.execute(
                    "SELECT * FROM reviews WHERE predicted_class=%s ORDER BY created_at DESC", 
                    (filter_class,)
                )
            else:
                cursor.execute("SELECT * FROM reviews ORDER BY created_at DESC")
            
            reviews = cursor.fetchall()
            
            for r in reviews:
                if r["lime_explanation"]:
                    try: 
                        r["lime_explanation"] = json.loads(r["lime_explanation"])
                    except: 
                        r["lime_explanation"] = {}
                # Convert decimal to float for JSON serialization
                r["prob_ai"] = float(r["prob_ai"]) if "prob_ai" in r else 0
                r["prob_human"] = float(r["prob_human"]) if "prob_human" in r else 0
                r["confidence"] = float(r["confidence"]) if "confidence" in r else 0
            
            return reviews
    finally:
        if connection:
            connection.close()

# -------------------------------
# 1️⃣3️⃣ Products
# -------------------------------
@app.get("/products")
def list_products():
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM products ORDER BY created_at DESC")
            return cursor.fetchall()
    finally:
        if connection:
            connection.close()

@app.get("/search_products")
def search_products(keyword: str):
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            search_term = f"%{keyword.strip()}%"
            cursor.execute(
                "SELECT * FROM products WHERE name LIKE %s OR description LIKE %s", 
                (search_term, search_term)
            )
            return cursor.fetchall()
    finally:
        if connection:
            connection.close()

# -------------------------------
# 1️⃣4️⃣ Health Check
# -------------------------------
@app.get("/health")
def health_check():
    # Test database connection
    connection = None
    try:
        connection = get_db_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    finally:
        if connection:
            connection.close()
    
    return {
        "status": "healthy", 
        "model_loaded": True,
        "database": db_status,
        "timestamp": str(datetime.now())
    }

# Import datetime for health check
