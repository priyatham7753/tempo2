# ShopMesh — Microservices E-Commerce Platform

A production-grade, fully containerized e-commerce application built with a modern microservices architecture. Features JWT authentication, product catalog, shopping cart, and order management — all orchestrated with Docker Compose.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DOCKER NETWORK: shopmesh-network              │
│                                                                        │
│  ┌─────────────────┐     REST API     ┌──────────────────────────┐   │
│  │   Frontend       │ ──────────────▶ │    Auth Service           │   │
│  │   React + Nginx  │                 │    Node.js / Express      │   │
│  │   Port: 3000     │ ──────────────▶ │    Port: 3001             │   │
│  └─────────────────┘     REST API     │    MongoDB: authdb        │   │
│           │                           └──────────────────────────┘   │
│           │              REST API     ┌──────────────────────────┐   │
│           ├────────────────────────▶  │   Product Service         │   │
│           │                           │   Node.js / Express       │   │
│           │                           │   Port: 3002              │   │
│           │              REST API     │   MongoDB: productdb      │   │
│           │                           └──────────────────────────┘   │
│           │                                        │                  │
│           │              REST API     ┌──────────────────────────┐   │
│           └────────────────────────▶  │   Order Service           │   │
│                                       │   Python / FastAPI        │   │
│                                       │   Port: 3003              │   │
│                                       │   MongoDB: orderdb        │   │
│                                       └──────────────────────────┘   │
│                                                    │                  │
│                              ┌─────────────────────┘                  │
│                              ▼                                        │
│                     ┌────────────────┐                               │
│                     │   MongoDB      │                               │
│                     │   Port: 27017  │                               │
│                     └────────────────┘                               │
└────────────────────────────────────────────────────────────────────────┘
```

### Service Communication

| Service          | Tech Stack          | Port | Database       |
|-----------------|---------------------|------|----------------|
| Frontend        | React + Nginx       | 3000 | —              |
| Auth Service    | Node.js / Express   | 3001 | MongoDB/authdb |
| Product Service | Node.js / Express   | 3002 | MongoDB/productdb |
| Order Service   | Python / FastAPI    | 3003 | MongoDB/orderdb |
| MongoDB         | MongoDB 7.0         | 27017| —              |

---

## Project Structure

```
capstone/
├── docker-compose.yml
├── README.md
│
├── frontend/                     # React SPA
│   ├── Dockerfile                # Multi-stage build (React → Nginx)
│   ├── nginx.conf                # Nginx SPA config
│   ├── package.json
│   └── src/
│       ├── App.js                # Routing & context providers
│       ├── index.js
│       ├── index.css             # Global dark theme styles
│       ├── context/
│       │   ├── AuthContext.js    # JWT auth state
│       │   └── CartContext.js    # Shopping cart state
│       ├── pages/
│       │   ├── AuthPage.js       # Login / Register
│       │   ├── ProductsPage.js   # Product catalog
│       │   └── OrdersPage.js     # Order history
│       ├── components/
│       │   ├── Navbar.js
│       │   └── CartModal.js
│       └── services/
│           └── api.js            # Axios API layer
│
├── auth-service/                 # Node.js Auth Microservice
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js              # Express app entry point
│       ├── models/User.js        # Mongoose User schema
│       ├── routes/auth.js        # Register, Login, Validate
│       └── middleware/auth.js    # JWT middleware
│
├── product-service/              # Node.js Product Microservice
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js              # Express app + product seeding
│       ├── models/Product.js     # Mongoose Product schema
│       ├── routes/products.js    # CRUD endpoints
│       └── middleware/auth.js    # Validates via Auth Service
│
└── order-service/                # Python FastAPI Order Microservice
    ├── Dockerfile
    ├── requirements.txt
    └── app/
        ├── main.py               # FastAPI app + lifespan handler
        ├── config.py             # Pydantic settings
        ├── models.py             # Pydantic request/response models
        ├── dependencies.py       # Auth & product service clients
        └── routes/
            └── orders.py         # Order CRUD endpoints
```

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/) (v2.0+, bundled with Docker Desktop)

> **Note:** You do **not** need Node.js, Python, or MongoDB installed locally — Docker handles everything.

---

## Quick Start

```bash
# 1. Clone / navigate to the project
cd capstone

# 2. Build and run all services
docker-compose up --build

# 3. Access the application
open http://localhost:3000
```

The first run will take 3-5 minutes to:
1. Build all Docker images
2. Start MongoDB
3. Start backend services (with retry logic)
4. Seed the product database with 8 sample products
5. Build and serve the React frontend

---

## Service URLs

| Service          | URL                                  |
|-----------------|--------------------------------------|
| Frontend         | http://localhost:3000               |
| Auth Service API | http://localhost:3001               |
| Product Service API | http://localhost:3002            |
| Order Service API (FastAPI Docs) | http://localhost:3003/docs |
| MongoDB          | mongodb://localhost:27017           |

---

## Environment Variables

### Auth Service

| Variable        | Default                                    | Description              |
|----------------|---------------------------------------------|--------------------------|
| `PORT`          | `3001`                                     | Service port             |
| `MONGO_URI`     | `mongodb://mongo:27017/authdb`             | MongoDB connection URI   |
| `JWT_SECRET`    | `shopmesh_jwt_secret_change_in_production` | JWT signing secret       |
| `JWT_EXPIRES_IN`| `24h`                                      | Token expiry duration    |

### Product Service

| Variable           | Default                                | Description              |
|-------------------|----------------------------------------|--------------------------|
| `PORT`             | `3002`                                | Service port             |
| `MONGO_URI`        | `mongodb://mongo:27017/productdb`     | MongoDB connection URI   |
| `AUTH_SERVICE_URL` | `http://auth-service:3001`            | Auth service base URL    |

### Order Service

| Variable              | Default                           | Description                |
|----------------------|-----------------------------------|----------------------------|
| `MONGO_URI`           | `mongodb://mongo:27017`          | MongoDB connection URI     |
| `DB_NAME`             | `orderdb`                        | Database name              |
| `AUTH_SERVICE_URL`    | `http://auth-service:3001`       | Auth service base URL      |
| `PRODUCT_SERVICE_URL` | `http://product-service:3002`    | Product service base URL   |
| `PORT`                | `3003`                           | Service port               |

### Frontend (Build-Time Args)

| Variable                        | Default                    | Description               |
|--------------------------------|----------------------------|---------------------------|
| `REACT_APP_AUTH_SERVICE_URL`    | `http://localhost:3001`   | Auth service public URL   |
| `REACT_APP_PRODUCT_SERVICE_URL` | `http://localhost:3002`   | Product service public URL|
| `REACT_APP_ORDER_SERVICE_URL`   | `http://localhost:3003`   | Order service public URL  |

---

## API Endpoints

### Auth Service (`http://localhost:3001`)

| Method | Endpoint              | Auth Required | Description              |
|--------|-----------------------|---------------|--------------------------|
| GET    | `/health`             | No            | Health check             |
| POST   | `/api/auth/register`  | No            | Register new user        |
| POST   | `/api/auth/login`     | No            | Login and get JWT token  |
| GET    | `/api/auth/me`        | Yes           | Get current user profile |
| POST   | `/api/auth/validate`  | No            | Validate JWT token (internal use) |

**Register Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Login Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

---

### Product Service (`http://localhost:3002`)

| Method | Endpoint              | Auth Required | Description              |
|--------|-----------------------|---------------|--------------------------|
| GET    | `/health`             | No            | Health check             |
| GET    | `/api/products`       | No            | List products (paginated, filterable) |
| GET    | `/api/products/:id`   | No            | Get single product       |
| POST   | `/api/products`       | Yes           | Create new product       |
| PUT    | `/api/products/:id`   | Yes           | Update product           |
| DELETE | `/api/products/:id`   | Yes           | Soft-delete product      |

**Query params for GET /api/products:**
- `category` — Filter by category
- `minPrice`, `maxPrice` — Price range filter
- `search` — Text search
- `page`, `limit` — Pagination

---

### Order Service (`http://localhost:3003`)

| Method | Endpoint                       | Auth Required | Description              |
|--------|--------------------------------|---------------|--------------------------|
| GET    | `/health`                      | No            | Health check             |
| POST   | `/api/orders`                  | Yes           | Create a new order       |
| GET    | `/api/orders`                  | Yes           | Get all my orders        |
| GET    | `/api/orders/:id`              | Yes           | Get specific order       |
| PATCH  | `/api/orders/:id/status`       | Yes           | Update order status      |

> Full interactive API docs available at **http://localhost:3003/docs** (FastAPI Swagger UI)

**Create Order Request Body:**
```json
{
  "items": [
    { "product_id": "PRODUCT_OBJECT_ID", "quantity": 2 }
  ],
  "shipping_address": "123 Main St, New York, NY 10001"
}
```

---

## Useful Commands

```bash
# Start all services
docker-compose up --build

# Start in detached mode (background)
docker-compose up --build -d

# View logs for a specific service
docker-compose logs -f auth-service
docker-compose logs -f product-service
docker-compose logs -f order-service
docker-compose logs -f frontend

# View all logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean state)
docker-compose down -v

# Rebuild a single service
docker-compose up --build auth-service

# Check service health
docker-compose ps
```

---

## Kubernetes Deployment (High-Level Guide)

To deploy ShopMesh to a Kubernetes cluster, follow these high-level steps:

### 1. Prerequisites
- A running Kubernetes cluster (AKS, EKS, GKE, or local `minikube`/`kind`)
- `kubectl` configured to point to your cluster
- A container registry (Docker Hub, ECR, GCR, etc.)
- `helm` (optional, for MongoDB)

### 2. Push Images to Registry
```bash
# Tag and push each service image
docker tag capstone-auth-service your-registry/shopmesh-auth:latest
docker push your-registry/shopmesh-auth:latest

docker tag capstone-product-service your-registry/shopmesh-products:latest
docker push your-registry/shopmesh-products:latest

docker tag capstone-order-service your-registry/shopmesh-orders:latest
docker push your-registry/shopmesh-orders:latest

docker tag capstone-frontend your-registry/shopmesh-frontend:latest
docker push your-registry/shopmesh-frontend:latest
```

### 3. Deploy MongoDB
Use the official MongoDB Helm chart or a managed database service:
```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install mongodb bitnami/mongodb --set auth.enabled=false
```

### 4. Create Kubernetes Manifests
For each service, create:
- `Deployment` — Pod spec with image, env vars, resource limits
- `Service` — ClusterIP for internal communication, LoadBalancer/NodePort for external access
- `ConfigMap` — Non-sensitive environment configuration
- `Secret` — Sensitive values (JWT secret, MongoDB URI)

### 5. Service Discovery
Replace Docker Compose service names with Kubernetes service DNS names:
- `mongo` → `mongodb.default.svc.cluster.local`
- `auth-service` → `auth-service.default.svc.cluster.local`
- `product-service` → `product-service.default.svc.cluster.local`

### 6. Ingress Controller
Deploy an Nginx Ingress Controller and create an Ingress resource to route:
- `yourdomain.com/` → Frontend service
- `yourdomain.com/api/auth` → Auth service (if needed)

### 7. Horizontal Pod Autoscaling (HPA)
```bash
kubectl autoscale deployment auth-service --cpu-percent=70 --min=2 --max=10
kubectl autoscale deployment product-service --cpu-percent=70 --min=2 --max=10
kubectl autoscale deployment order-service --cpu-percent=70 --min=2 --max=10
```

### 8. Secrets Management
```bash
kubectl create secret generic shopmesh-secrets \
  --from-literal=jwt-secret=YOUR_SECRET \
  --from-literal=mongo-uri=YOUR_MONGO_URI
```

---

## Security Notes

> ⚠️ **For production use, always:**
> - Change the `JWT_SECRET` to a strong random value
> - Enable MongoDB authentication
> - Use HTTPS with valid SSL certificates
> - Set `NODE_ENV=production`
> - Use Kubernetes Secrets or a secrets manager (HashiCorp Vault, AWS Secrets Manager)
> - Implement rate limiting on auth endpoints
> - Review and restrict CORS origins

---

## Tech Stack Summary

| Layer       | Technology             |
|-------------|------------------------|
| Frontend    | React 18, React Router v6, Axios |
| Auth Service| Node.js 20, Express 4, Mongoose, bcryptjs, jsonwebtoken |
| Product Service | Node.js 20, Express 4, Mongoose |
| Order Service | Python 3.11, FastAPI, Motor (async MongoDB), httpx |
| Database    | MongoDB 7.0           |
| Containerization | Docker, Docker Compose |
| Web Server  | Nginx (Alpine)        |
