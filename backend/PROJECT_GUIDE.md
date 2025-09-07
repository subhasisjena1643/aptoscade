# AptosCade Backend - Complete Setup Guide

## 🎯 Project Overview

**AptosCade** is a comprehensive gaming platform built on the Aptos blockchain that allows users to:
- Play various arcade-style games
- Submit scores and compete on leaderboards  
- Manage blockchain transactions through Aptos integration
- Earn achievements and track gaming progress
- Connect with frontend and blockchain components seamlessly

## 🏗️ Architecture

### Backend (Your Part)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Blockchain**: Aptos SDK integration
- **Authentication**: JWT-based
- **API**: RESTful with Swagger documentation

### Integration Points
- **Frontend (FE)**: RESTful API endpoints with CORS support
- **Blockchain (BE)**: Direct Aptos SDK integration for transactions
- **Database**: Centralized data management for all components

## 📁 Project Structure

```
c:\Users\Santhosh S\Desktop\BE\
├── src/
│   ├── config/
│   │   ├── database.ts          # Prisma database connection
│   │   └── aptos.ts            # Aptos blockchain configuration
│   ├── controllers/
│   │   ├── authController.ts    # Authentication logic
│   │   ├── gameController.ts    # Game management
│   │   └── aptosController.ts   # Blockchain operations
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication middleware
│   │   ├── errorHandler.ts     # Global error handling
│   │   └── notFound.ts         # 404 handler
│   ├── routes/
│   │   ├── auth.ts             # Authentication routes
│   │   ├── game.ts             # Game routes
│   │   ├── user.ts             # User management
│   │   ├── leaderboard.ts      # Leaderboard system
│   │   ├── transaction.ts      # Transaction tracking
│   │   └── aptos.ts            # Aptos blockchain routes
│   ├── types/
│   │   └── index.ts            # TypeScript type definitions
│   ├── utils/
│   │   ├── logger.ts           # Winston logging
│   │   ├── jwt.ts              # JWT utilities
│   │   ├── validation.ts       # Input validation schemas
│   │   └── helpers.ts          # Utility functions
│   └── server.ts               # Main application entry point
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Sample data seeding
├── dist/                       # Compiled JavaScript output
├── logs/                       # Application logs
├── .env                        # Environment configuration
├── docker-compose.yml          # Docker setup
├── Dockerfile                  # Container configuration
└── README.md                   # Documentation
```

## 🚀 Quick Start

### Prerequisites
1. **Node.js** (v18+)
2. **PostgreSQL** (v13+)
3. **npm** or **yarn**

### Setup Steps

1. **Navigate to project directory:**
   ```bash
   cd "c:\Users\Santhosh S\Desktop\BE"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   # Copy and edit environment file
   cp .env.example .env
   # Update DATABASE_URL and other settings in .env
   ```

4. **Setup database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues

# Database commands
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
npm run prisma:seed      # Seed database with sample data

# Docker commands
npm run docker:build     # Build Docker image
npm run docker:run       # Run Docker container
```

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user profile

### Games
- `GET /api/v1/games` - List all games
- `GET /api/v1/games/:id` - Get specific game
- `POST /api/v1/games/:id/score` - Submit game score
- `GET /api/v1/games/:id/scores` - Get game scores

### Users
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `GET /api/v1/users/games` - Get user game history

### Leaderboards
- `GET /api/v1/leaderboard` - Global leaderboard
- `GET /api/v1/leaderboard/:gameId` - Game-specific leaderboard

### Aptos Blockchain
- `GET /api/v1/aptos/account/:address` - Get account info
- `GET /api/v1/aptos/balance/:address` - Get account balance
- `GET /api/v1/aptos/transaction/:hash` - Get transaction details
- `POST /api/v1/aptos/transactions` - Submit transaction
- `POST /api/v1/aptos/faucet` - Request testnet tokens

### Transactions
- `GET /api/v1/transactions` - Get user transactions
- `GET /api/v1/transactions/:id` - Get specific transaction

## 🔗 Integration Guide

### Frontend Integration
The backend provides RESTful APIs that the frontend can consume:

```javascript
// Example: User authentication
const response = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
const token = data.data.token; // Use for subsequent requests
```

### Blockchain Integration
The backend handles Aptos blockchain operations:

```javascript
// Example: Submit game score with blockchain transaction
const response = await fetch('http://localhost:3000/api/v1/aptos/transactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    txHash: 'transaction_hash_from_aptos',
    amount: '1000',
    tokenType: 'APT',
    transactionType: 'REWARD'
  })
});
```

## 🐳 Docker Deployment

### Quick Start with Docker Compose
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis (for caching)
- Backend API server

### Individual Docker Commands
```bash
# Build image
docker build -t aptoscade-backend .

# Run container
docker run -p 3000:3000 aptoscade-backend
```

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `APTOS_NETWORK` | Aptos network | `devnet` |
| `CORS_ORIGIN` | Frontend URL | `http://localhost:3001` |

## 📊 Database Schema

### Core Tables
- **Users**: User accounts with Aptos wallet integration
- **Games**: Game definitions and metadata
- **GameScores**: Individual game scoring records
- **Transactions**: Blockchain transaction tracking
- **LeaderboardEntries**: Leaderboard rankings
- **Achievements**: User achievements system

## 🔐 Security Features

- JWT authentication with secure token handling
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Input validation with Joi schemas
- SQL injection protection via Prisma
- Environment variable security

## 📚 API Documentation

Once running, access interactive API documentation at:
- **Swagger UI**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## 🧪 Testing

The backend includes sample data and can be tested immediately:

1. **Register a user**: `POST /api/v1/auth/register`
2. **Login**: `POST /api/v1/auth/login`
3. **Get games**: `GET /api/v1/games`
4. **Submit score**: `POST /api/v1/games/:id/score`
5. **Check leaderboard**: `GET /api/v1/leaderboard`

## 🔄 Development Workflow

1. **Start development server**: `npm run dev`
2. **Make changes** to TypeScript files
3. **Test APIs** using Swagger UI or Postman
4. **Check logs** in `logs/` directory
5. **Run tests**: `npm test`
6. **Build for production**: `npm run build`

## 🤝 Integration Checklist

### For Frontend Integration:
- ✅ CORS configured for frontend origin
- ✅ JSON API responses with consistent format
- ✅ JWT authentication headers
- ✅ Error handling with proper HTTP status codes
- ✅ Pagination support for large datasets

### For Blockchain Integration:
- ✅ Aptos SDK integrated
- ✅ Account management endpoints
- ✅ Transaction submission and verification
- ✅ Balance checking functionality
- ✅ Testnet faucet integration

## 🚨 Production Considerations

1. **Security**: Update JWT_SECRET in production
2. **Database**: Use production PostgreSQL with SSL
3. **Environment**: Set NODE_ENV=production
4. **Monitoring**: Configure logging and health checks
5. **SSL**: Enable HTTPS in production
6. **Scaling**: Consider Redis for session management

## 📞 Support

The backend is production-ready and includes:
- Comprehensive error handling
- Detailed logging
- Health check endpoints
- API documentation
- Docker support
- Database migrations

**Ready for integration with Frontend and Blockchain components!**
