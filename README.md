# 🛡️ Nexora Fraud Predictor

### Future Fraud Predictor Using Crowd Intelligence

A full-stack web application that predicts and prevents fraud using crowd-sourced intelligence. Users can report fraudulent phone numbers, emails, UPI IDs, and bank accounts, while others can verify if a contact is safe before transacting.

> 📚 **For comprehensive documentation** including architecture diagrams, API details, and hackathon submission materials, see [NEXORA_FRAUD_PREDICTOR_DOCUMENTATION.md](./NEXORA_FRAUD_PREDICTOR_DOCUMENTATION.md)

## 🛡️ Features

- **Crowd Intelligence Algorithm**: Risk scoring based on community reports
- **Real-time Verification**: Instantly check any phone/email/UPI for fraud risk
- **User Authentication**: Secure JWT-based authentication
- **KYC Verification**: Phone verification with OTP (mocked for demo)
- **Fraud Reporting**: Submit detailed fraud reports with evidence
- **Risk Levels**: Safe (Green), Suspicious (Yellow), High Risk (Red)
- **User Actions**: Block or mark entities as safe
- **Activity Logging**: All searches and reports are logged

## 🧠 Crowd Intelligence Scoring Logic

The core algorithm calculates fraud risk as follows:

| Condition | Points |
|-----------|--------|
| Each report in last 30 days | +1 point |
| Phishing category | +2 additional points |
| Identity Theft category | +2 additional points |

### Risk Levels:
- **0 points**: ✅ SAFE (Green)
- **1-5 points**: ⚠️ SUSPICIOUS (Yellow)
- **>5 points**: 🚨 HIGH RISK / UNSAFE (Red)

## 📁 Project Structure

```
fraud-predictor/
├── backend/
│   ├── models/
│   │   ├── User.js           # User schema with auth
│   │   ├── FraudReport.js    # Fraud report schema
│   │   └── ActivityLog.js    # Activity logging schema
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   └── api.js            # All API endpoints
│   ├── server.js             # Express server entry point
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── components/
│   │   ├── Layout.js         # Main layout wrapper
│   │   ├── Navbar.js         # Navigation bar
│   │   ├── Footer.js         # Footer component
│   │   ├── RiskMeter.js      # Risk visualization component
│   │   ├── RiskChecker.js    # Risk checking form
│   │   └── FraudReportForm.js # Fraud report form
│   ├── context/
│   │   └── AuthContext.js    # Authentication context
│   ├── lib/
│   │   └── api.js            # Axios API client
│   ├── pages/
│   │   ├── _app.js           # Next.js app wrapper
│   │   ├── index.js          # Landing page
│   │   ├── login.js          # Login page
│   │   ├── register.js       # Registration page
│   │   ├── kyc.js            # KYC verification page
│   │   └── dashboard.js      # Main dashboard
│   ├── styles/
│   │   └── globals.css       # Global styles with Tailwind
│   ├── package.json
│   └── .env.local
│
├── package.json              # Root package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd fraud-predictor
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Configure environment variables**

   Backend (`.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/fraud_predictor
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   CORS_ORIGIN=http://localhost:3000
   ```

   Frontend (`.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the application**

   Terminal 1 (Backend):
   ```bash
   cd backend
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Health Check: http://localhost:5000/health

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Get current user profile |

### KYC
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/kyc/submit` | Submit KYC information |
| POST | `/api/kyc/send-otp` | Send OTP (mocked) |
| POST | `/api/kyc/verify-otp` | Verify OTP (mocked) |

### Fraud Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/fraud/report` | Submit fraud report |
| GET | `/api/fraud/my-reports` | Get user's reports |

### Risk Check (Crowd Intelligence)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/check-risk` | Check entity risk level |
| GET | `/api/check-risk/:entity` | Check risk (GET method) |

### User Actions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/actions/block` | Block an entity |
| POST | `/api/actions/mark-safe` | Mark entity as safe |
| GET | `/api/actions/my-lists` | Get blocked/safe lists |

### Statistics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stats/overview` | Get platform statistics |

## 🔐 Security Features

- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: express-validator for all inputs
- **CORS Protection**: Configurable CORS policy
- **Rate Limiting**: Can be added for production

## 🎨 UI Components

### RiskMeter
Visual component displaying fraud risk with:
- Color-coded risk levels (Green/Yellow/Red)
- Animated score meter
- Report breakdown
- Action buttons (Block/Mark Safe)

### FraudReportForm
Comprehensive form with:
- Entity type selection
- Category dropdown
- Description & evidence fields
- Amount lost input
- Form validation

### RiskChecker
Search interface with:
- Entity type tabs
- Real-time search
- Risk result display

## 📝 User Flow

1. **Landing Page** → Learn about the platform
2. **Register** → Create account (Name, Email, Password)
3. **KYC** → Submit phone number for verification
4. **Verify OTP** → Confirm phone (use 123456 for demo)
5. **Dashboard** → Check risks or report fraud
6. **Check Risk** → Search for phone/email/UPI
7. **View Result** → See risk level and reports
8. **Take Action** → Block or mark as safe
9. **Report Fraud** → Submit new fraud report

## 🧪 Testing

Use the mock OTP `123456` for phone verification during development.

## 📄 License

MIT License - feel free to use this project for learning or building upon it.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## 📚 Documentation

For complete technical documentation, architecture details, and hackathon submission materials, see:
- [Full Documentation](./NEXORA_FRAUD_PREDICTOR_DOCUMENTATION.md)

---

**Built with ❤️ by the Nexora Team to protect people from online fraud**
