# 🛡️ RetailGuard — AI-Powered Loss Prevention System

An intelligent loss prevention system for small retail shops that actively monitors business operations and identifies potential financial losses in real time.

## 🌟 Key Features

### 📦 Stock Shortage Detection
- Tracks daily sales velocity per item
- Predicts stockout dates using trend analysis
- Alerts shop owners before items run out

### 💰 Payment Mismatch Detection  
- Compares expected vs received payments (UPI & Cash)
- Flags missing or incorrect transactions
- Real-time payment verification

### 🤖 Smart AI Insights
- Detects unusual patterns (sudden sales drops, abnormal transactions)
- Z-score based anomaly detection
- Actionable recommendations with confidence scores

### 🌐 Multi-Language Support
- English, Hindi (हिंदी), Kannada (ಕನ್ನಡ)
- Designed for non-technical shop owners

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) |
| Backend | Python (Flask) |
| Database | Firebase Firestore (mock data for demo) |
| AI/Logic | Python analytics engine |
| APIs | REST APIs |
| Payments | Simulated UPI tracking |
| Localization | react-i18next |

---

## 🚀 Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on: `http://localhost:5000`

---

## 📁 Project Structure

```
RetailGaurd/
├── frontend/           # React.js (Vite)
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Dashboard, Inventory, etc.
│   │   ├── services/   # API service layer
│   │   ├── locales/    # i18n translations (en, hi, kn)
│   │   └── i18n.js     # i18n configuration
│   └── index.html
│
├── backend/            # Python Flask API
│   ├── app.py          # Main API + AI engine
│   └── requirements.txt
│
└── README.md
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Dashboard summary |
| GET | `/api/inventory` | List inventory |
| POST | `/api/inventory` | Add item |
| PUT | `/api/inventory/<id>` | Update item |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions` | Record transaction |
| GET | `/api/payments` | Payment records |
| POST | `/api/payments/verify` | Verify payment |
| GET | `/api/insights` | AI-generated insights |
| GET | `/api/alerts` | Active alerts |
| GET | `/api/health` | Health check |

---

## 👥 Team

Built for hackathon demonstration.

## 📄 License

MIT
