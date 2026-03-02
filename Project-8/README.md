# VeriRefund 🛍️

An AI-powered product review platform that distinguishes between human and AI-generated reviews using machine learning. VeriRefund provides transparency through explainable AI (LIME explanations) and includes comprehensive admin tools for review moderation and product management.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Database Setup](#database-setup)
- [Key Features Explained](#key-features-explained)
- [Development](#development)
- [Dependencies Overview](#dependencies-overview)
- [Future Improvements](#future-improvements)


---

## 🎯 Overview

**VeriRefund** is a full-stack web application designed to help e-commerce platforms verify the authenticity of product reviews. Using a fine-tuned RoBERTa model trained on human vs. AI-generated reviews, the platform:

- Classifies reviews as human-written or AI-generated
- Provides confidence scores and explainability through LIME analysis
- Offers admin controls for review moderation and product management
- Maintains user authentication and review history
- Delivers a responsive, user-friendly interface

The application combines a **PyTorch-based ML backend** with a **React frontend**, connected via RESTful APIs and a MySQL database.

---

## 🚀 Features

### User Features
- ✅ **Product Browsing** - Browse and search products with detailed information
- ✅ **User Authentication** - Secure login and registration system
- ✅ **Review Submission** - Add authentic reviews to products
- ✅ **AI Detection** - Automatic classification of reviews as human or AI-generated
- ✅ **Explainability** - LIME-based explanations for model predictions
- ✅ **Review Management** - View and manage your own reviews

### Admin Features
- 🔒 **Admin Authentication** - Secure admin login
- 📊 **Review Moderation** - View all reviews with prediction details
- 📈 **Analytics** - Filter reviews by classification type
- 🛒 **Product Management** - Add new products to the catalog
- 👥 **User Management** - Monitor user accounts and activity

### Technical Features
- 🤖 **ML-Powered Detection** - RoBERTa-based classification model
- 📊 **LIME Explanations** - Interpretable ML with feature importance analysis
- 🔐 **Password Security** - bcrypt hashing for user passwords
- 🎨 **Responsive Design** - Mobile-friendly UI
- 🐛 **Debug Panel** - Inspect API responses and logs during development
- ⚡ **CORS Support** - Secure cross-origin requests

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **ML/AI**: PyTorch, Transformers (RoBERTa), LIME
- **Database**: MySQL
- **Security**: bcrypt (password hashing)
- **Server**: Uvicorn
- **API**: RESTful with CORS middleware

### Frontend
- **Framework**: React 19.x
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **UI Enhancements**: 
  - react-hot-toast (notifications)
  - react-icons (icons)
  - recharts (data visualization)
- **Testing**: Jest, React Testing Library
- **Build**: Create React App (react-scripts)

### Infrastructure
- **Development**: Node.js 14+, Python 3.8+
- **Package Management**: npm, pip

---

## 📂 Project Structure

```
VeriRefund/
├── README.md                          # Project documentation
├── backend/                           # Python FastAPI backend
│   ├── backend.py                     # Main API application
│   ├── requirements.txt               # Python dependencies
│   └── models/
│       ├── best_model.pt             # PyTorch model (binary classification)
│       └── roberta_human_ai_model/   # RoBERTa fine-tuned model
│           ├── config.json
│           ├── model.safetensors
│           ├── tokenizer_config.json
│           └── tokenizer.json
│
└── frontend/                          # React frontend
    ├── package.json                   # Node dependencies
    ├── public/
    │   ├── index.html
    │   ├── manifest.json
    │   └── robots.txt
    └── src/
        ├── App.js                     # Main app component
        ├── App.css                    # Global styles
        ├── api.js                     # API client utilities
        ├── index.js                   # React entry point
        ├── index.css                  # Base styles
        ├── styles/
        │   └── theme.css              # Theme configuration
        └── components/
            ├── Navbar.js              # Navigation bar
            ├── ProductList.js         # Product listing page
            ├── ProductDetail.js       # Single product page
            ├── AddReviewForm.js       # Review submission form
            ├── ReviewList.js          # Reviews display
            ├── SearchBar.js           # Product search
            ├── AuthModal.js           # Login/register modal
            ├── AdminPanel.js          # Admin home panel
            ├── AdminReviews.js        # Admin review management
            ├── DebugPanel.js          # Debug utilities
            ├── LimeExplanationModal.js # LIME visualization
            ├── LoadingSpinner.js      # Loading indicator
            └── [corresponding .css files for each component]
```

---

## 📋 Prerequisites

### System Requirements
- **OS**: Windows, macOS, or Linux
- **Node.js**: v14.x or higher (for frontend)
- **Python**: 3.8 or higher (for backend)
- **MySQL**: 5.7 or higher (for database)
- **CUDA** (optional): For GPU acceleration on the backend

### Required Software
1. **Node.js & npm** - [Download](https://nodejs.org/)
2. **Python** - [Download](https://www.python.org/)
3. **MySQL** - [Download](https://www.mysql.com/)
4. **Git** (optional) - for version control

---

## 🔧 Installation & Setup

### Step 1: Database Setup

1. **Create MySQL Database**
```bash
mysql -u root -p
```

2. **Create database and tables**
```sql
CREATE DATABASE shopping_ai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopping_ai;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    image LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    text TEXT NOT NULL,
    predicted_class VARCHAR(50),
    prob_ai DECIMAL(10, 4),
    prob_human DECIMAL(10, 4),
    confidence DECIMAL(10, 4),
    lime_explanation JSON,
    status VARCHAR(50) DEFAULT 'approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_product_id ON reviews(product_id);
CREATE INDEX idx_user_id ON reviews(user_id);
CREATE INDEX idx_predicted_class ON reviews(predicted_class);
```

### Step 2: Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment** (recommended)
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

4. **Verify backend setup**
```bash
python backend.py
```

The backend should start on `http://localhost:8000`

### Step 3: Frontend Setup

1. **Open new terminal and navigate to frontend**
```bash
cd frontend
```

2. **Install Node dependencies**
```bash
npm install
```

3. **Verify frontend setup**
```bash
npm start
```

The frontend should open at `http://localhost:3000`

---

## ▶️ Running the Application

### Method 1: Development Mode (Recommended)

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
# Activate venv (see Step 2 above)
pip install -r requirements.txt
python -m uvicorn backend:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install  # (if not done already)
npm start
```

Visit: `http://localhost:3000`

### Method 2: Production Build

**Backend (Production):**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn backend:app --host 0.0.0.0 --port 8000
```

**Frontend (Build for Production):**
```bash
cd frontend
npm run build
# Serve the build folder with a static server
npx serve -s build
```

---

## 🔌 API Endpoints

### Authentication (Public)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/signup` | Register new user |
| POST | `/login` | Login user |
| POST | `/admin/login` | Login admin (hardcoded: admin/admin123) |

### Products (Public)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/products` | List all products |
| GET | `/products/{product_id}/reviews` | Get reviews for a product |
| GET | `/search_products?keyword={term}` | Search products by name/description |

### Reviews (Authenticated)

| Method | Endpoint | Purpose | Headers |
|--------|----------|---------|---------|
| POST | `/reviews` | Submit a new review | X-User-Id |
| GET | `/products/{product_id}/reviews` | Get product reviews | X-User-Id (optional) |

### Admin (Admin Only)

| Method | Endpoint | Purpose | Headers |
|--------|----------|---------|---------|
| POST | `/admin/add_product` | Add new product | is-admin: true |
| GET | `/admin/reviews` | View all reviews with predictions | is-admin: true |
| GET | `/admin/reviews?filter_class={class}` | Filter reviews by type | is-admin: true |

### Health Check (Public)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Check backend & database status |

### Request/Response Examples

**Add Review:**
```bash
curl -X POST "http://localhost:8000/reviews" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 1" \
  -d '{
    "product_id": 1,
    "review": "This product is amazing! Works perfectly as described."
  }'
```

**Response:**
```json
{
  "message": "Review submitted successfully"
}
```

---

## 🗄️ Database Setup

### Connection Details

Update `backend.py` if your MySQL credentials differ:

```python
def get_db_connection():
    connection = pymysql.connect(
        host="localhost",      # MySQL host
        user="root",           # MySQL username
        password="",           # MySQL password
        database="shopping_ai", # Database name
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )
    return connection
```

### Default Admin Credentials

- **Username**: `admin`
- **Password**: `admin123`

⚠️ **Note**: Change these credentials in production!

---

## 🎨 Key Features Explained

### 1. AI Review Detection

The backend uses a fine-tuned RoBERTa model to classify reviews:

- **Model**: `RobertaForSequenceClassification`
- **Classes**: Human Review (0), AI Review (1)
- **Input**: Review text (max 256 tokens)
- **Output**: Class prediction + confidence score

```python
pred_class, prob_ai, prob_human, confidence = predict_review(review_text)
```

### 2. LIME Explanations

LIME (Local Interpretable Model-agnostic Explanations) provides feature importance:

- Shows which words influenced the prediction
- Helps users understand why a review was flagged as AI
- Extracted from top 5 most important features
- Displayed in an interactive modal

### 3. Authentication & Security

- User passwords hashed with bcrypt
- Admin authentication via headers
- JWT-like user ID tracking via X-User-Id header
- CORS middleware restricts to frontend origin

### 4. Admin Dashboard

Two-tier admin interface:

- **Admin Panel**: Add products, view statistics
- **Admin Reviews**: View and filter all reviews with ML predictions

### 5. Responsive Design

- Mobile-first CSS approach
- React components for reusability
- Styled components and CSS modules
- Toast notifications for user feedback

---

## 👨‍💻 Development

### Testing

**Frontend Tests:**
```bash
cd frontend
npm test
```

**Backend Health Check:**
```bash
curl http://localhost:8000/health
```

### Debug Panel

Access debug information in the frontend:
- View API responses
- Inspect model predictions
- Check localStorage data

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Backend won't start | Check port 8000 is free, verify requirements.txt installed |
| Frontend can't connect to backend | Ensure backend is running on 8000, check CORS in backend.py |
| Database connection error | Verify MySQL is running, check credentials in backend.py |
| Model loading error | Ensure models/ directory has required files |
| Port already in use | Change port in startup command (--port 3001) |

### Environment Variables

Create a `.env` file in frontend directory (optional):
```
REACT_APP_API_URL=http://localhost:8000
```

### Frontend Configuration

- **API Base URL**: Configured in `src/api.js`
- **CORS Origin**: Set in `backend.py` CORS middleware
- **Default Theme**: Located in `src/styles/theme.css`

---

## 📦 Dependencies Overview

### Backend Key Packages
- **fastapi** (0.129.0) - Web framework
- **torch** & **transformers** - ML/AI models
- **lime** (0.2.0.1) - Model explainability
- **pymysql** - Database driver
- **bcrypt** (5.0.0) - Password hashing
- **uvicorn** - ASGI server

### Frontend Key Packages
- **react** (19.2.4) - UI framework
- **axios** (1.13.5) - HTTP client
- **react-router-dom** (7.13.1) - Routing
- **react-hot-toast** (2.6.0) - Notifications
- **recharts** (3.7.0) - Data visualization

---

## 🔮 Future Improvements

### Short-term Enhancements (1-2 months)
- 🔐 **JWT Authentication** - Replace header-based auth with secure JWT tokens
- 📧 **Email Verification** - Add email confirmation for user registration
- 🔄 **Review Editing** - Allow users to modify their published reviews
- ⭐ **Rating System** - Add star ratings alongside text reviews
- 🎯 **Advanced Filtering** - Sort reviews by helpfulness, date, rating
- 🐳 **Docker Support** - Containerize frontend and backend with Docker Compose

### Mid-term Features (2-4 months)
- 📊 **Advanced Analytics Dashboard** - Visual charts for review trends and patterns
- 🔔 **Notification System** - Email/in-app alerts for review responses and updates
- 💬 **Review Comments** - Allow users to comment on and reply to reviews
- 🏷️ **Review Tagging** - Categorize reviews (e.g., Quality, Shipping, Customer Service)
- 🤖 **Model Retraining Pipeline** - Automated periodic retraining with new data
- 👥 **User Reputation System** - Score users based on review quality and helpfulness
- 🎯 **Upvote/Downvote System** - Community-driven review validation

### Long-term Initiatives (4+ months)
- 🌍 **Multi-language Support** - Localize UI and support reviews in multiple languages
- 🔗 **E-commerce Platform Integration** - Connect with Shopify, WooCommerce, Amazon, etc.
- 📱 **Mobile Applications** - Native iOS and Android apps using React Native
- 🧠 **Multi-model Support** - Support for different AI models and fine-tuning options
- 🔐 **Social Authentication** - OAuth 2.0 integration (Google, GitHub, Facebook)
- 📈 **Sentiment Analysis** - Additional NLP features beyond AI detection
- 🎓 **Enhanced Explainability** - Attention-based explanations and feature visualization
- ⚡ **Performance Optimization** - Database indexing, caching with Redis, query optimization
- 🧪 **A/B Testing Framework** - Test different UI variations and features
- 📡 **Real-time Features** - WebSocket support for live notifications and updates


### Scalability & Infrastructure
- ⚙️ **Horizontal Scaling** - Load balancing with multiple backend instances
- 🗄️ **Database Optimization** - Better indexing, query optimization, connection pooling
- 💾 **Caching Strategy** - Redis implementation for session and data caching
- 📦 **Static Asset CDN** - Serve frontend assets from CloudFront, CloudFlare, etc.
- 🔄 **CI/CD Pipeline** - GitHub Actions or Jenkins for automated testing and deployment
- 📊 **Observability Stack** - ELK or Datadog for logging, monitoring, and metrics
- 🚨 **Alert Management** - Real-time alerts for service degradation and errors
- 🗂️ **Database Replication** - Master-slave setup for high availability


### Known Issues to Address
- ⚠️ **Admin Credentials** - Replace hardcoded credentials with proper role management
- ⚠️ **LIME Visualizations** - Improve explainability UI with better visualizations
- ⚠️ **Review Moderation** - Implement approval workflow before publication
- ⚠️ **Error Messaging** - More detailed error handling and user guidance
- ⚠️ **Session Management** - Implement persistent sessions with database storage
- ⚠️ **Model Updates** - Create safe deployment pipeline for model retraining
