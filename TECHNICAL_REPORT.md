# Technical Report: Brent Spence Bridge Data Visualization
## Remote Access Fix & Architecture Redesign

**Date:** November 24, 2024  
**Project:** Brent Spence Bridge Monitoring System  
**URL:** https://ucii.ceas5.uc.edu

---

## Executive Summary

Remote users were unable to view data plots when accessing the application through the university reverse proxy. The issue was caused by the frontend making API calls to `localhost:5001`, which doesn't exist on remote users' computers. The solution involved adding an nginx reverse proxy container to serve both frontend and backend through a single port (3000), with the backend accessible via an `/api/` route prefix.

---

## Problem Description

### Symptoms
- Remote users could access the website at `https://ucii.ceas5.uc.edu`
- When clicking "Plot", users saw: **"No battery data available. Please upload data to begin."**
- Browser console showed: `GET http://localhost:5001/plot-data?pier=1 net::ERR_CONNECTION_REFUSED`

### Root Cause Analysis

The application architecture had two separate services on different ports:
- **Frontend (React):** Port 3000
- **Backend (Flask API):** Port 5001

The frontend JavaScript code contained hardcoded API calls:
```javascript
// Original code in Chart.js
axios.get('http://localhost:5001/plot-data?pier=1')
```

When users accessed the site through the reverse proxy:
1. Reverse proxy forwarded requests to workstation:3000 (frontend)
2. Frontend loaded in user's browser
3. User clicked "Plot"
4. Browser attempted to call `http://localhost:5001` (user's own computer)
5. No backend exists on user's computer → Connection refused

### Constraint
The university reverse proxy could only point to **ONE port** on the workstation. The requirement was to serve both frontend and backend from a single port.

---

## Solution Architecture

### Before (Broken)
```
                                    ┌─────────────────┐
                                    │   Workstation   │
User Browser ──→ Reverse Proxy ──→  │                 │
                (ucii.ceas5.uc.edu) │  Frontend:3000  │ ✅
                                    │  Backend:5001   │ ❌ (not accessible)
                                    └─────────────────┘
                    
Browser tries localhost:5001 → FAILS (wrong computer)
```

### After (Fixed)
```
                                    ┌─────────────────────────────────┐
                                    │         Workstation             │
User Browser ──→ Reverse Proxy ──→  │                                 │
                (ucii.ceas5.uc.edu) │  ┌─────────────────────────┐    │
                         ↓          │  │    nginx (Port 3000)    │    │
                    Port 3000 ──────│──│                         │    │
                                    │  │   /      → Frontend     │    │
                                    │  │   /api/* → Backend      │    │
                                    │  └──────────┬──────┬───────┘    │
                                    │             │      │            │
                                    │             ↓      ↓            │
                                    │      Frontend   Backend         │
                                    │      (3001)     (5001)          │
                                    └─────────────────────────────────┘
```

---

## Implementation Details

### 1. Frontend Code Changes (Chart.js)

**Modified all API calls to use relative URLs with `/api/` prefix:**

| Before | After |
|--------|-------|
| `http://localhost:5001/plot-data?pier=${pier}` | `/api/plot-data?pier=${pier}` |
| `http://localhost:5001/predict` | `/api/predict` |
| `http://localhost:5001/export-filtered-data` | `/api/export-filtered-data` |
| `http://localhost:5001/detect-anomalies?strain_type=...` | `/api/detect-anomalies?strain_type=...` |

### 2. nginx Configuration (nginx.conf)

Created nginx configuration to route requests:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 3000;
        server_name localhost;

        # Serve frontend (all non-API requests)
        location / {
            proxy_pass http://frontend:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Proxy /api to backend (strips /api prefix)
        location /api/ {
            proxy_pass http://backend:5001/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            
            # CORS headers
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
        }
    }
}
```

### 3. Docker Compose Changes (docker-compose.yml)

**Modified frontend port:**
```yaml
frontend:
  image: brent-spence-project-master
  container_name: brent-frontend
  command: ["sh", "-c", "cd frontend && PORT=3001 npm start"]
  ports:
    - "3001:3001"  # Changed from 3000 to 3001
  depends_on:
    - backend
```

**Added nginx service:**
```yaml
nginx:
  image: nginx:alpine
  container_name: brent-nginx
  ports:
    - "3000:3000"  # Main entry point
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
  depends_on:
    - frontend
    - backend
  restart: unless-stopped
```

---

## Port Mapping Summary

| Service | Internal Port | External Port | Purpose |
|---------|--------------|---------------|---------|
| nginx | 3000 | 3000 | Main entry point (reverse proxy target) |
| frontend | 3001 | 3001* | React development server |
| backend | 5001 | 5001* | Flask API server |
| database | 3306 | 3307 | MySQL database |

*Internal only - accessed through nginx, not directly exposed to reverse proxy

---

## Request Flow

### Loading the Website
1. User navigates to `https://ucii.ceas5.uc.edu`
2. University reverse proxy forwards to workstation:3000
3. nginx receives request for `/`
4. nginx forwards to frontend:3001
5. React app loads in user's browser

### Fetching Data (Plot Button)
1. User clicks "Plot" button
2. Frontend JavaScript calls `/api/plot-data?pier=1`
3. Browser sends request to `https://ucii.ceas5.uc.edu/api/plot-data?pier=1`
4. University reverse proxy forwards to workstation:3000
5. nginx receives request starting with `/api/`
6. nginx strips `/api` prefix and forwards to backend:5001 as `/plot-data?pier=1`
7. Backend queries database and returns JSON data
8. nginx passes response back through reverse proxy
9. Frontend receives data and renders plot

---

## Data Loading

Prior to this fix, the database also needed to be populated with sensor data.

### Data Loaded
| Pier | Battery Records | Strain Records | Total |
|------|-----------------|----------------|-------|
| Pier 1 | 8,124 | 130,080 | 138,204 |
| Pier 2 | 8,015 | 128,240 | 136,255 |
| Pier 3 | 8,123 | 0 | 8,123 |
| **Total** | **24,262** | **258,320** | **282,582** |

### Data Loading Scripts
- `load_all_data.sh` - Loads all pier data automatically
- `insert_data.sh` - CLI tool for individual data insertion

---

## Files Modified/Created

### Created
| File | Purpose |
|------|---------|
| `nginx.conf` | nginx routing configuration |
| `load_all_data.sh` | Automated data loading script |
| `src/setupProxy.js` | Development proxy configuration |

### Modified
| File | Changes |
|------|---------|
| `docker-compose.yml` | Added nginx service, changed frontend port |
| `src/components/Chart.js` | Changed API URLs from `localhost:5001` to `/api/` |
| `package.json` | Added http-proxy-middleware devDependency |
| `insert_data.sh` | Added `--pier` parameter support |

---

## Final URLs

### For Remote Users
- **Application:** `https://ucii.ceas5.uc.edu`
- **API Base:** `https://ucii.ceas5.uc.edu/api/`

### For Local Testing
- **Application:** `http://localhost:3000`
- **API Base:** `http://localhost:3000/api/`

### API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/plot-data?pier={n}` | GET | Fetch battery and strain data |
| `/api/predict` | GET | Get ML predictions |
| `/api/export-filtered-data` | GET | Export data as CSV |
| `/api/detect-anomalies?strain_type={type}` | GET | Detect anomalies in strain data |

---

## Deployment Commands

### Start All Services
```bash
cd /home/janvi/Downloads/Brent-Spence-Project-master
docker compose up -d
```

### Rebuild After Code Changes
```bash
docker compose down
docker image rm -f brent-spence-project-master
docker compose up --build -d
```

### Load Data
```bash
./load_all_data.sh
```

### View Logs
```bash
docker logs brent-nginx     # nginx logs
docker logs brent-frontend  # React logs
docker logs brent-backend   # Flask logs
docker logs brent-mysql     # Database logs
```

---

## Troubleshooting

### Users see "Add data to begin"
1. Check browser console (F12) for actual error
2. If `localhost:5001` error: User needs hard refresh (Ctrl+Shift+R)
3. If `/api/` error: Check nginx and backend containers are running

### Hard Refresh for Users
After deployment changes, users must clear browser cache:
- **Windows/Linux:** Ctrl + Shift + R
- **Mac:** Cmd + Shift + R

### Verify Services Running
```bash
docker ps
# Should show: brent-nginx, brent-frontend, brent-backend, brent-mysql
```

### Test API Locally
```bash
curl http://localhost:3000/api/plot-data?pier=1
# Should return JSON data
```

---

## Conclusion

The remote access issue was resolved by implementing an nginx reverse proxy layer that combines both frontend and backend services on a single port (3000). This architecture:

1. ✅ Meets the constraint of single-port access from university reverse proxy
2. ✅ Uses clean `/api/` prefix for backend routes
3. ✅ Works for both local and remote users
4. ✅ Requires no changes to the university reverse proxy configuration
5. ✅ Follows industry best practices for web application architecture

The application is now fully functional for remote users accessing through `https://ucii.ceas5.uc.edu`.

---

**Report Generated:** November 24, 2024  
**Status:** ✅ Issue Resolved

