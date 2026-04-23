# ShopMesh — Production-Grade Microservices DevOps Platform

## Architecture Overview

```
Internet
   │
   ▼
NGINX Gateway Fabric  (namespace: gateway)
   ├── /              → frontend:80          (namespace: frontend)
   ├── /api/auth      → auth-service:3001    (namespace: backend)
   ├── /api/products  → product-service:3002 (namespace: backend)
   └── /api/orders    → order-service:8000   (namespace: backend)

Each backend service → own dedicated MongoDB StatefulSet (namespace: database)
All MongoDB data persisted on NFS PersistentVolumes (5Gi each)
NetworkPolicy: Default-Deny-All + explicit allowlists per service
```

### Services

| Service | Language | Port | Database |
|---------|----------|------|----------|
| frontend | React + Nginx | 80 | — |
| auth-service | Node.js / Express | 3001 | auth-mongodb |
| product-service | Node.js / Express | 3002 | product-mongodb |
| order-service | Python / FastAPI | 8000 | order-mongodb |

---

## Repository Structure

```
capstone/
├── frontend/
│   ├── src/                         # React source code
│   ├── Dockerfile
│   ├── nginx.conf
│   └── .github/workflows/ci.yml     # CI: lint → sonar → snyk → build → trivy → push
│
├── auth-service/
│   ├── src/
│   ├── Dockerfile
│   └── .github/workflows/ci.yml
│
├── product-service/
│   ├── src/
│   ├── Dockerfile
│   └── .github/workflows/ci.yml
│
├── order-service/
│   ├── app/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .github/workflows/ci.yml
│
├── helm-charts/
│   ├── auth-chart/                  # Deployment, Service, ConfigMap, Secret, NetworkPolicy
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   ├── product-chart/               # Same structure
│   ├── order-chart/                 # Same structure
│   ├── frontend-chart/              # Same structure
│   └── mongodb/                     # Reusable StatefulSet chart (deploy 3×)
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│
├── k8s/
│   ├── 00-namespaces.yaml           # Namespaces + Default-Deny NetworkPolicies
│   ├── 01-nfs-storage.yaml          # StorageClass + 3 PersistentVolumes
│   └── 02-gateway-api.yaml          # GatewayClass + Gateway + 4 HTTPRoutes
│
├── gitops/
│   ├── argocd-applications.yaml     # AppProject + 7 ArgoCD Applications
│   └── environments/
│       ├── dev/common-values.yaml
│       └── prod/
│           ├── auth-values.yaml
│           ├── product-values.yaml
│           ├── order-values.yaml
│           ├── frontend-values.yaml
│           ├── auth-mongodb-values.yaml
│           ├── product-mongodb-values.yaml
│           └── order-mongodb-values.yaml
│
└── docker-compose.yml               # Local development
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Kubernetes | 1.28+ | Container orchestration |
| kubectl | 1.28+ | Cluster management |
| Helm | 3.13+ | Chart deployment |
| ArgoCD | 2.9+ | GitOps CD |
| NFS Server | — | Persistent storage for MongoDB |
| GitHub account | — | GHCR container registry |

---

## Step-by-Step Deployment Guide

### Step 1 — Configure NFS Server

Run on your NFS server (replace `10.0.0.10` with your server's IP):

```bash
sudo mkdir -p /exports/auth-mongodb /exports/product-mongodb /exports/order-mongodb
sudo chmod 777 /exports/auth-mongodb /exports/product-mongodb /exports/order-mongodb

sudo tee -a /etc/exports <<EOF
/exports/auth-mongodb    *(rw,sync,no_subtree_check,no_root_squash)
/exports/product-mongodb *(rw,sync,no_subtree_check,no_root_squash)
/exports/order-mongodb   *(rw,sync,no_subtree_check,no_root_squash)
EOF

sudo exportfs -ra
sudo systemctl restart nfs-kernel-server

# Verify
showmount -e localhost
```

### Step 2 — Create Namespaces & Network Policies

```bash
kubectl apply -f k8s/00-namespaces.yaml

# Verify
kubectl get namespaces | grep -E "frontend|backend|database|gateway"
kubectl get networkpolicy -A
```

### Step 3 — Create NFS Storage (update IP first)

```bash
# Replace with your NFS server IP
sed -i 's/10.0.0.10/YOUR_NFS_IP/g' k8s/01-nfs-storage.yaml

kubectl apply -f k8s/01-nfs-storage.yaml

# Verify PVs are Available
kubectl get pv
kubectl get storageclass
```

### Step 4 — Install NGINX Gateway Fabric

```bash
# Install Gateway API CRDs
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.1.0/standard-install.yaml

# Install NGINX Gateway Fabric via Helm
helm repo add nginx-stable https://helm.nginx.com/stable
helm repo update

kubectl apply -f https://raw.githubusercontent.com/nginxinc/nginx-gateway-fabric/v1.3.0/deploy/crds.yaml

helm install ngf nginx-stable/nginx-gateway-fabric \
  --namespace gateway \
  --create-namespace \
  --set service.type=LoadBalancer

# Wait for gateway pod
kubectl wait --for=condition=ready pod \
  -l app.kubernetes.io/name=nginx-gateway-fabric \
  -n gateway --timeout=120s
```

### Step 5 — Apply Gateway API Routes

```bash
kubectl apply -f k8s/02-gateway-api.yaml

# Verify
kubectl get gateway -n gateway
kubectl get httproute -A
```

### Step 6 — Deploy MongoDB Instances

```bash
# Deploy auth-mongodb
helm install auth-mongodb ./helm-charts/mongodb \
  --namespace database \
  --set fullname=auth-mongodb \
  --set auth.user=authuser \
  --set auth.password=authpass \
  --set auth.database=authdb \
  --set ownerService=auth-service

# Deploy product-mongodb
helm install product-mongodb ./helm-charts/mongodb \
  --namespace database \
  --set fullname=product-mongodb \
  --set auth.user=productuser \
  --set auth.password=productpass \
  --set auth.database=productdb \
  --set ownerService=product-service

# Deploy order-mongodb
helm install order-mongodb ./helm-charts/mongodb \
  --namespace database \
  --set fullname=order-mongodb \
  --set auth.user=orderuser \
  --set auth.password=orderpass \
  --set auth.database=orderdb \
  --set ownerService=order-service

# Wait for all MongoDB pods to be Running
kubectl get pods -n database -w
```

### Step 7 — Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD server
kubectl wait --for=condition=available deployment/argocd-server \
  -n argocd --timeout=300s

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Access UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Open: https://localhost:8080  (admin / <password above>)
```

### Step 8 — Apply ArgoCD Applications

```bash
kubectl apply -f gitops/argocd-applications.yaml

# Watch sync status
kubectl get applications -n argocd -w

# Or use ArgoCD CLI
argocd app list
```

### Step 9 — Configure GitHub Actions Secrets

In **each** service repository, add these secrets under **Settings → Secrets → Actions**:

| Secret | Value |
|--------|-------|
| `SONAR_TOKEN` | SonarQube user token |
| `SONAR_HOST_URL` | `https://sonarqube.yourorg.com` |
| `SNYK_TOKEN` | Snyk API token |
| `HELM_CHARTS_TOKEN` | GitHub PAT with `repo` write scope |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL |

> `GITHUB_TOKEN` is automatically provided — no manual setup needed for GHCR push.

---

## CI/CD Flow

```
Developer pushes to main
        │
        ▼
GitHub Actions CI
  1. npm/pip lint + unit tests
  2. SonarQube code quality scan
  3. Snyk dependency vulnerability scan
  4. Docker build (local only)
  5. Trivy container scan → blocks on CRITICAL/HIGH
  6. Docker push to ghcr.io/<org>/<service>:<sha> + :latest
  7. Update helm-charts/<service>/values.yaml image tag
  8. Slack notification (pass/fail)
        │
        ▼
ArgoCD detects values.yaml change
        │
        ▼
ArgoCD syncs → kubectl apply → Rolling update
```

---

## Verification Commands

```bash
# All pods running
kubectl get pods -A

# MongoDB StatefulSets
kubectl get statefulsets -n database
kubectl get pvc -n database

# Backend services reachable
kubectl get svc -n backend
kubectl get endpoints -n backend

# Gateway external IP
GATEWAY_IP=$(kubectl get svc -n gateway \
  -o jsonpath='{.items[0].status.loadBalancer.ingress[0].ip}')
echo "Gateway: http://$GATEWAY_IP"

# Test endpoints
curl http://$GATEWAY_IP/api/auth/health
curl http://$GATEWAY_IP/api/products
curl http://$GATEWAY_IP/api/orders
curl http://$GATEWAY_IP/

# ArgoCD all apps synced
kubectl get applications -n argocd
```

---

## Troubleshooting

### Pod: ImagePullBackOff
```bash
kubectl describe pod <pod> -n backend
# Fix: set GHCR package visibility to Public, or add imagePullSecret
```

### MongoDB: Connection refused
```bash
# Check StatefulSet is Running
kubectl get pods -n database
# Test DNS resolution from backend pod
kubectl exec -it <auth-pod> -n backend -- \
  curl auth-mongodb-headless.database.svc.cluster.local:27017
# Check Secret values are correct
kubectl get secret auth-secret -n backend -o jsonpath='{.data.MONGO_URI}' | base64 -d
```

### PVC: Pending
```bash
kubectl describe pvc auth-mongodb-pvc -n database
# Fix: verify NFS server IP in k8s/01-nfs-storage.yaml
# Verify NFS export: showmount -e <NFS_IP>
# Check storageClassName matches: nfs-storage
```

### NetworkPolicy: Traffic blocked
```bash
# Test connectivity
kubectl exec -it <order-pod> -n backend -- \
  curl http://auth-service.backend.svc.cluster.local:3001/health
# List all policies
kubectl get networkpolicy -A
# Describe specific policy
kubectl describe networkpolicy order-service-netpol -n backend
```

### ArgoCD: OutOfSync
```bash
argocd app sync shopmesh-auth
argocd app get shopmesh-auth
# Check: values.yaml image tag is valid, repo is accessible
```

### Gateway: 404 / no route
```bash
kubectl describe httproute auth-route -n backend
kubectl logs -n gateway \
  -l app.kubernetes.io/name=nginx-gateway-fabric --tail=50
# Check: GatewayClass controller name must match installed NGF
```

---

## Network Policy Matrix

| Source | Destination | Port | Allowed |
|--------|-------------|------|---------|
| gateway | frontend | 80 | ✅ |
| gateway | auth/product/order | 3001/3002/8000 | ✅ |
| frontend | auth/product/order | 3001/3002/8000 | ✅ |
| order-service | auth-service | 3001 | ✅ |
| order-service | product-service | 3002 | ✅ |
| auth-service | auth-mongodb | 27017 | ✅ |
| product-service | product-mongodb | 27017 | ✅ |
| order-service | order-mongodb | 27017 | ✅ |
| auth-service | product-mongodb | 27017 | ❌ |
| Any → Any (default) | Any | Any | ❌ |

---

## Local Development

```bash
# Start all services locally with Docker Compose
docker-compose up --build

# Services available at:
# Frontend:        http://localhost:3000
# Auth Service:    http://localhost:3001
# Product Service: http://localhost:3002
# Order Service:   http://localhost:8000
# MongoDB:         mongodb://localhost:27017
```

---

## Security Checklist

- [x] Default-Deny NetworkPolicies in all namespaces
- [x] Cross-database access blocked at network level
- [x] Secrets stored as Kubernetes Secrets (not ConfigMaps)
- [x] Trivy blocks images with CRITICAL/HIGH CVEs
- [x] Snyk scans dependencies before build
- [x] SonarQube enforces code quality gates
- [x] MongoDB `prune: false` in ArgoCD (prevents accidental data loss)
- [x] Image tags use commit SHA for full traceability
- [ ] Replace `CHANGE_ME_JWT_SECRET` with a real 32+ char secret
- [ ] Replace `10.0.0.10` with your actual NFS server IP
- [ ] Replace `YOUR_GITHUB_ORG` with your GitHub username/org
