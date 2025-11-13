# NestJS Boilerplate

A modern, production-ready NestJS boilerplate with authentication, authorization, pagination, caching, and monitoring.

- **Author**: [Maëva Pasteur](https://maevapasteur.com)

---

## ✨ Features

- 🔐 **Authentication & Authorization** - JWT with role-based access control
- 👥 **User Management** - Complete user CRUD with admin controls  
- 📄 **Advanced Pagination** - Sorting, filtering, and metadata
- 🗄️ **Database** - PostgreSQL with TypeORM and optimized queries
- ⚡ **Caching** - Redis with metrics, tags, and cache-aside pattern
- 🏗️ **Clean Architecture** - Repositories, services, and dependency injection
- 🔒 **Security** - Guards, decorators, validation, and permission system
- 📊 **Monitoring** - Health checks, cache metrics, and alerts
- 🐳 **Docker Support** - Redis containerization
- 📝 **Type Safety** - Full TypeScript with strict configuration

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 14+
- **Redis** (via Docker or Homebrew)
- **Docker** (optional, for Redis)

### 📦 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd nestjs-boilerplate
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration (see Environment Variables section)
```

### 🗄️ Database Setup

**Option 1: Local PostgreSQL**
```bash
# Install PostgreSQL (if not installed)
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb nestjs1

# Or connect and create manually
psql postgres
CREATE DATABASE nestjs1;
\q
```

**Option 2: Docker PostgreSQL**
```bash
# Use the provided docker-compose (uncomment postgres service)
docker-compose up postgres -d
```

### ⚡ Redis Setup

**Option 1: Local Redis (Recommended)**
```bash
# Install Redis
brew install redis

# Start Redis
brew services start redis

# Test connection
redis-cli ping  # Should return PONG
```

**Option 2: Docker Redis**
```bash
# Start Redis container
docker-compose up redis -d

# Check logs
docker-compose logs redis
```

### 🎯 Start Application

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

**✅ Success indicators:**
- `✅ Redis connected`
- `🚀 Application is running on: http://localhost:3005`
- Database queries in logs

---

## 🔧 Environment Variables

Create a `.env` file with these variables:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| **Server** |
| `PORT` | Application port | `3005` | ✅ |
| `NODE_ENV` | Environment | `development` | ✅ |
| **Database** |
| `DB_HOST` | PostgreSQL host | `localhost` | ✅ |
| `DB_PORT` | PostgreSQL port | `5432` | ✅ |
| `DB_USER` | Database username | `postgres` | ✅ |
| `DB_USER_PWD` | Database password | `your_password` | ✅ |
| `DB_NAME` | Database name | `nestjs1` | ✅ |
| `DB_MIN_POOL_SIZE` | Min connections | `5` | ❌ |
| `DB_MAX_POOL_SIZE` | Max connections | `10` | ❌ |
| **Authentication** |
| `JWT_SECRET` | JWT secret key | `your-secret-key` | ✅ |
| `JWT_REFRESH` | Refresh token secret | `your-refresh-secret` | ✅ |
| `ACCESS_TOKEN_VALIDITY` | Access token TTL | `15m` | ❌ |
| `REFRESH_TOKEN_VALIDITY` | Refresh token TTL | `7d` | ❌ |
| **Redis Cache** |
| `REDIS_HOST` | Redis host | `localhost` | ✅ |
| `REDIS_PORT` | Redis port | `6379` | ✅ |
| `REDIS_PASSWORD` | Redis password | `` (empty for local) | ❌ |
| `CACHE_DEFAULT_TTL` | Default cache TTL (seconds) | `600` | ❌ |
| `CACHE_MAX_ITEMS` | Max cache items | `10000` | ❌ |

---

## 🌐 API Endpoints

### 🔐 Authentication
```http
POST   /auth/register     # Register new user
POST   /auth/login        # Login user  
POST   /auth/refresh      # Refresh access token
GET    /auth/profile      # Get current user profile (requires auth)
```

### 👥 Users
```http
GET    /users?page=1&limit=10&sortBy=email&sortOrder=ASC    # Paginated users
GET    /users/:id         # Get user by ID
PATCH  /users/:id         # Update user (owner/admin only)
PATCH  /users/:id/password # Change password (owner/admin only)
DELETE /users/:id         # Delete user (owner/admin only)
```

### 👑 Admin (Admin Only)
```http
POST   /admin/register    # Register new admin
GET    /admin/users       # Get all users with pagination
```

### 🏥 Health & Monitoring
```http
GET    /health            # Overall health status
GET    /health/redis      # Redis connection status
GET    /health/cache/metrics    # Cache performance metrics
GET    /health/dashboard  # Health dashboard
GET    /health/cache/top-keys   # Most used cache keys
```

### 📄 Pagination Example
```bash
# Get users with pagination and sorting
curl "http://localhost:3005/users?page=2&limit=5&sortBy=createdAt&sortOrder=DESC"

# Response format:
{
  "items": [...],
  "pagination": {
    "currentPage": 2,
    "itemsPerPage": 5,
    "totalItems": 50,
    "totalPages": 10,
    "hasPreviousPage": true,
    "hasNextPage": true
  }
}
```

---

## 🐳 Docker Commands

```bash
# Start Redis only (recommended)
docker-compose up redis -d

# View Redis logs
docker-compose logs -f redis

# Stop Redis
docker-compose down redis

# Remove Redis data
docker-compose down -v

# Check Docker status
docker ps
```

---

## 📊 Redis Monitoring

### Check Health Endpoints
```bash
curl http://localhost:3005/health
curl http://localhost:3005/health/redis
curl http://localhost:3005/health/cache/metrics
curl http://localhost:3005/health/dashboard
curl http://localhost:3005/health/cache/top-keys
```

**Monitor logs** - Redis stats appear every 5 minutes:
```
[RedisHealthService] 📊 Redis Stats: Memory: 12.5MB/15.2MB | Keys: 245 | Usage: 4.9%
```

### Debug Redis

**Connect to Redis:**
```bash
# Local Redis
redis-cli

# Docker Redis
docker exec -it nestjs-redis redis-cli
```

**Useful Redis commands:**
```bash
INFO memory        # Memory usage
DBSIZE            # Number of keys
MEMORY STATS      # Detailed memory stats
MEMORY DOCTOR     # Memory optimization tips
CONFIG GET maxmemory
CONFIG GET maxmemory-policy
KEYS pattern*     # Find keys by pattern
FLUSHDB          # Clear current database
```

---

## 🏗️ Project Architecture

```
src/
├── common/               # Shared utilities
│   ├── dto/             # Common DTOs (pagination, etc.)
│   ├── guards/          # Authorization guards  
│   ├── interfaces/      # Shared interfaces
│   └── utils/           # Utility functions
├── config/              # Configuration modules
│   ├── auth.config.ts   # JWT configuration
│   ├── cache.config.ts  # Redis configuration
│   └── database.config.ts # DB configuration
├── infrastructure/      # Infrastructure layer
│   ├── cache/          # Redis cache implementation
│   ├── health/         # Health checks
│   ├── monitoring/     # Alerts and monitoring
│   └── redis/          # Redis module
├── modules/             # Business logic modules
│   ├── auth/           # Authentication & authorization
│   ├── users/          # User management
│   └── admin/          # Admin functionality
└── setup/              # Database factories
```

---

## 🛠️ Development

```bash
# Development with hot reload
npm run start:dev

# Debug mode
npm run start:debug

# Build for production  
npm run build

# Run tests
npm run test           # Unit tests
npm run test:watch     # Watch mode
npm run test:cov       # Coverage report
npm run test:e2e       # End-to-end tests

# Code quality
npm run lint           # ESLint
npm run format         # Prettier
```

---

## 🔄 Cache Usage Examples

The application includes a powerful caching layer:

```typescript
// Service example
async getUser(id: string) {
  return this.cacheService.remember(
    `user:${id}`,
    () => this.userRepository.findById(id),
    { ttl: 300, tags: ['users'] }
  );
}

// Invalidate by tags
await this.cacheService.invalidateTags(['users']);

// Manual cache operations
await this.cacheService.set('key', value, { ttl: 600 });
const cached = await this.cacheService.get('key');
await this.cacheService.delete('key');
```

---

## 🚨 Troubleshooting

### Redis Connection Issues
```bash
# Check Redis status
brew services list | grep redis

# Restart Redis
brew services restart redis

# Test connection
redis-cli ping
```

### Database Connection Issues
```bash
# Check PostgreSQL status  
brew services list | grep postgres

# Test connection
psql -h localhost -p 5432 -U postgres -d nestjs1
```

### Port Already in Use
```bash
# Find and kill process on port 3005
lsof -ti:3005 | xargs kill -9
```

### Cache Issues
```bash
# Flush Redis cache
redis-cli FLUSHDB

# Check Redis memory
redis-cli INFO memory
```

---

## 📚 Technology Stack

- **Framework**: NestJS 11+
- **Language**: TypeScript 5+
- **Database**: PostgreSQL 14+ with TypeORM
- **Cache**: Redis 7+ with IoRedis
- **Authentication**: JWT + Passport
- **Validation**: class-validator + class-transformer
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier
- **Containerization**: Docker + Docker Compose

---

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request