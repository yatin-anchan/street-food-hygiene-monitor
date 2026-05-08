# 📍 Street Food Hygiene Monitoring System

![Astro](https://img.shields.io/badge/Astro-Frontend-FF5D01?style=for-the-badge\&logo=astro)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge\&logo=cloudflare)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge\&logo=supabase)
![KV Storage](https://img.shields.io/badge/Cloudflare-KV%20Cache-1E90FF?style=for-the-badge)
![Status](https://img.shields.io/badge/Project-Live-success?style=for-the-badge)

🌐 **Live Demo:** [https://street-food-hygiene-monitor.pages.dev/](https://street-food-hygiene-monitor.pages.dev/)

---

## 🧠 Overview

A full-stack **edge-native hygiene reporting platform** that enables citizens to anonymously report street food safety issues, while providing administrators with real-time analytics, geospatial visualization, and moderation tools.

The system is designed with a **serverless-first architecture** using Cloudflare Workers, Supabase, and KV caching for performance optimization.

---

## 🚀 Key Features

### 👤 Public Platform

* Anonymous complaint (feedback) submission
* Vendor classification system
* Severity tagging (Low → Critical)
* Image evidence upload (Supabase Storage)
* Client-side image cropping before upload
* Geolocation tagging (browser-based)
* Interactive complaint wall
* Map-based visualization of reports
* Filtering by severity

---

### 🛡️ Admin Dashboard

* Secure authentication system
* Live analytics dashboard
* Complaint moderation (status updates)
* Severity distribution charts
* Geo-map visualization of incidents
* Real-time monitoring interface

---

## 🗺️ System Architecture

```mermaid
flowchart TD

A[User (Astro Frontend)] --> B[Cloudflare Worker API]

B --> C[Supabase Database]
B --> D[Supabase Storage Bucket]

B --> E[Cloudflare KV Cache]

E --> B
C --> B

B --> A
```

### 🔁 Data Flow Explanation

1. User submits complaint via Astro frontend
2. Request is processed by Cloudflare Worker
3. Data is stored in Supabase PostgreSQL
4. Image uploaded to Supabase Storage
5. Latest complaints cached in Cloudflare KV
6. GET requests served via KV-first strategy
7. Supabase used as fallback source of truth

---

## ⚙️ Tech Stack

### Frontend

* Astro (Static + Server Rendering)
* Vanilla JavaScript
* CSS Design System
* Leaflet.js (Maps)
* Chart.js (Admin Analytics)

### Backend (Edge API)

* Cloudflare Workers (Serverless API)
* REST Architecture

### Database & Storage

* Supabase PostgreSQL
* Supabase Storage Buckets

### Caching Layer

* Cloudflare KV (Edge Cache)

### Deployment

* Cloudflare Pages (Frontend)
* Cloudflare Workers (Backend API)

---

## 📡 API Endpoints

| Method | Endpoint             | Description                 |
| ------ | -------------------- | --------------------------- |
| POST   | `/api/submit`        | Submit complaint            |
| GET    | `/api/messages`      | Fetch complaints (KV-first) |
| POST   | `/api/update-status` | Admin status update         |

---

## 🗄️ Database Schema (Supabase)

```sql
complaints (
  id SERIAL PRIMARY KEY,
  vendor_name TEXT,
  vendor_type TEXT,
  issue_types TEXT[],
  severity TEXT,
  description TEXT,
  image_url TEXT,
  latitude FLOAT,
  longitude FLOAT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

## ⚡ Cloudflare KV Strategy

### Cache Key:

```
latest_complaints
```

### Behavior:

* KV checked first (fast edge response)
* Supabase used as fallback
* KV updated after writes
* Cache invalidated on status updates

---

## 🔐 Admin System

Features:

* Secure login-based access
* Complaint moderation pipeline
* Status lifecycle:

  ```
  Pending → Reviewed → Resolved
  ```
* Geo-map inspection of complaints
* Analytics dashboard for trends

---

## 📊 Analytics Dashboard

Admin insights include:

* Total complaint volume
* Severity distribution
* Category breakdown
* Time-based trends
* Map clustering of incidents

---

## 🗺️ Geolocation System

* Browser Geolocation API used at submission time
* Latitude & Longitude stored per report
* Admin map view powered by Leaflet
* Public wall includes optional map expansion

---

## ☁️ Image Handling

* Client-side image cropping before upload
* Images stored in Supabase Storage Bucket
* URLs linked directly in complaint records
* Optimized rendering in UI cards

---

## 🧪 Local Development

### Frontend

```bash
cd astro-frontend
npm install
npm run dev
```

### Worker

```bash
cd worker-api
npm install
wrangler dev
```

---

## 🌐 Deployment

### Frontend (Cloudflare Pages)

[https://street-food-hygiene-monitor.pages.dev/](https://street-food-hygiene-monitor.pages.dev/)

### Backend (Cloudflare Workers)

[https://worker-api.your-domain.workers.dev](https://worker-api.your-domain.workers.dev)

---

## 📌 Key Engineering Decisions

* Edge-first architecture for global low latency
* KV caching to reduce database load
* Supabase used as system of record
* Worker acts as unified API gateway
* Client-side preprocessing (image cropping) reduces backend load

---

## 🧠 Design Philosophy

This system follows a **serverless distributed architecture pattern**:

* Frontend optimized for static delivery (Astro)
* Backend logic handled at edge (Cloudflare Workers)
* Database decoupled (Supabase)
* Cache layer for performance (KV)

---

## 👨‍💻 Author

Built by **Yatin Anil Anchan**
Web Development Assignment – Anonymous Feedback Wall
