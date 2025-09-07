# AptosCade Backend

A comprehensive backend API for the AptosCade gaming platform built on the Aptos blockchain.

## 🚀 Features

- **User Authentication & Management**: JWT-based authentication with secure user registration and login
- **Game Management**: Complete game lifecycle management with scoring system
- **Aptos Blockchain Integration**: Direct integration with Aptos network for transactions and account management
- **Leaderboards**: Dynamic leaderboards with multiple time periods
- **Transaction Tracking**: Complete transaction history and status tracking
- **RESTful API**: Well-documented REST API with Swagger documentation
- **Database**: PostgreSQL with Prisma ORM
- **Security**: Rate limiting, CORS, helmet security headers

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Blockchain**: Aptos SDK
- **Authentication**: JWT
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn
- Docker (optional, for containerized deployment)

## 🔧 Installation

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### 2. Environment Configuration

Edit the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/aptoscade_db"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Aptos
APTOS_NETWORK=devnet
APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1

# Server
PORT=3000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Run the Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Start all services (PostgreSQL, Redis, Backend)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Docker Build

```bash
# Build the image
npm run docker:build

# Run the container
npm run docker:run
```

## 📚 API Documentation

Once the server is running, you can access:

- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## 🔗 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user profile

### Games
- `GET /api/v1/games` - Get all games
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

### Aptos Integration
- `GET /api/v1/aptos/account/:address` - Get Aptos account info
- `GET /api/v1/aptos/balance/:address` - Get account balance
- `GET /api/v1/aptos/transaction/:hash` - Get transaction details
- `POST /api/v1/aptos/transactions` - Submit transaction
- `POST /api/v1/aptos/faucet` - Request testnet tokens

### Transactions
- `GET /api/v1/transactions` - Get user transactions
- `GET /api/v1/transactions/:id` - Get specific transaction

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🗄️ Database Schema

The application uses the following main entities:

- **Users**: User accounts with Aptos wallet integration
- **Games**: Game definitions and metadata
- **GameScores**: Individual game scoring records
- **Transactions**: Blockchain transaction tracking
- **LeaderboardEntries**: Leaderboard rankings
- **Achievements**: User achievements system

## 🔧 Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

### Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Express middleware
├── routes/          # API routes
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── server.ts        # Main server file
```

## 🔗 Integration with Frontend & Blockchain

### Frontend Integration
- CORS configured for frontend at `http://localhost:3001`
- RESTful API endpoints for all frontend needs
- Standardized response format with success/error status

### Blockchain Integration
- Direct Aptos SDK integration
- Account management and balance checking
- Transaction submission and verification
- Testnet faucet integration for development

## 🚨 Security Features

- Rate limiting to prevent abuse
- CORS protection
- Helmet security headers
- JWT token validation
- Input validation and sanitization
- SQL injection protection via Prisma

## 🔍 Monitoring & Logging

- Winston logging with different levels
- Request logging with Morgan
- Error tracking and handling
- Health check endpoint

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `APTOS_NETWORK` | Aptos network (devnet/testnet/mainnet) | `devnet` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:3001` |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the API documentation at `/api-docs`
2. Review the logs for error details
3. Ensure all environment variables are correctly set
4. Verify database connectivity

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure production database
4. Set up proper logging
5. Configure reverse proxy (nginx)
6. Enable SSL/TLS
7. Set up monitoring and alerting
