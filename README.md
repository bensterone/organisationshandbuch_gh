# Organisationshandbuch

A full‑stack web application for building, organizing, and browsing a company’s living **Operations & Compliance Handbook**. It lets teams structure content in a navigation tree, write rich documents, manage BPMN processes, upload files, tag content, track favorites/recents, and discover related items via wiki links — all secured behind authentication.

---

## ✨ Features

- **Navigation Tree**: Hierarchical structure for policies, SOPs, processes, etc.
- **Rich Documents**: Edit and view documents with version metadata.
- **BPMN Processes**: Create and visualize BPMN models (via `bpmn-js`).
- **File Management**: Upload and serve attachments with type/size validation.
- **Tags**: Tag documents and browse by tags.
- **Favorites & Recents**: Quick access to what matters to you.
- **Wiki Links**: Cross-link items (incoming/outgoing).
- **Search**: Suggestions and document search.
- **Auth & JWT**: Login with password hash; JWT-based sessions.
- **Security hardening**: Helmet + CSP, rate-limited login, same-origin setup.
- **Health Endpoints**: `/health`, `/healthz`, `/readyz` (DB readiness).

---

## 🧱 Tech Stack

**Frontend**
- React 18 (CRA), React Router
- Tailwind CSS
- `bpmn-js` for BPMN editor/viewer
- Axios client with token handling

**Backend**
- Node.js (v20 recommended), Express
- MySQL (`mysql2/promise`) with pooled connections
- JWT auth (`jsonwebtoken`), password hashing (`bcryptjs`)
- File uploads (`multer`) with MIME/extension checks
- Helmet, compression, CORS (configurable), express-rate-limit

**Database**
- MySQL 8.x (works with 5.7+ if you adjust types)

---

## 📁 Project Structure

```
organisationshandbuch/
├─ backend/                 # Express API + static hosting for the built frontend
│  ├─ .env.example
│  ├─ package.json
│  └─ src/
│     ├─ server.js
│     ├─ config/
│     │  └─ database.js
│     ├─ middleware/
│     │  ├─ accessLog.js
│     │  ├─ auth.js
│     │  ├─ errorHandler.js
│     │  └─ upload.js
│     ├─ routes/           # Slim controllers delegating to services
│     │  ├─ auth.routes.js
│     │  ├─ navigation.routes.js
│     │  ├─ processes.routes.js
│     │  ├─ documents.routes.js
│     │  ├─ files.routes.js
│     │  ├─ search.routes.js
│     │  ├─ favorites.routes.js
│     │  ├─ recents.routes.js
│     │  ├─ tags.routes.js
│     │  ├─ wikilinks.routes.js
│     │  ├─ discovery.routes.js
│     │  ├─ compliance.routes.js
│     │  └─ privacy.routes.js
│     ├─ services/         # All domain logic centralized here
│     │  ├─ auth.service.js
│     │  ├─ navigation.service.js
│     │  ├─ processes.service.js
│     │  ├─ documents.service.js
│     │  ├─ files.service.js
│     │  ├─ search.service.js
│     │  ├─ favorites.service.js
│     │  ├─ recents.service.js
│     │  ├─ tags.service.js
│     │  ├─ wikilinks.service.js
│     │  ├─ discovery.service.js
│     │  ├─ compliance.service.js
│     │  └─ privacy.service.js
│     └─ utils/
│        ├─ jwt.js
│        ├─ password.js
│        └─ validators.js
├─ frontend/
│  ├─ public/               # CRA static
│  └─ src/
│     ├─ config/env.js      # `REACT_APP_*` config (defaults to same-origin `/api`)
│     ├─ services/api.js    # Axios instance & interceptors
│     ├─ components/...
│     ├─ pages/...
│     └─ stores/...
├─ .nvmrc                    # Node 20
└─ README.md
```

> Note: In production, the **backend** serves the **built frontend** from `frontend/build` and proxies API under the same origin (`/api`).

---

## ⚙️ Setup (Development)

### Prerequisites
- **Node.js 20** (see `.nvmrc`)
- **MySQL** 8.x (local or remote)

### 1) Backend environment
Copy and edit environment variables:
```bash
cp backend/.env.example backend/.env
# Edit strong secrets: DB_PASSWORD, JWT_SECRET, IP_HASH_SECRET, etc.
```

**`.env` keys (backend):**
```
NODE_ENV=development            # use production for deploy
PORT=8000

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=organisationshandbuch
DB_CONNECTION_LIMIT=10

JWT_SECRET=replace-with-strong-random
JWT_EXPIRES_IN=8h

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800          # 50 MB

IP_HASH_SECRET=replace-with-strong-random

# Leave empty for same-origin in production
# CORS_ORIGIN=https://your-domain.tld
```

### 2) Install dependencies
```bash
# Frontend
cd frontend
npm ci

# Backend
cd ../backend
npm ci
```

### 3) Prepare database
Create an empty database in MySQL:
```sql
CREATE DATABASE organisationshandbuch CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'app'@'%' IDENTIFIED BY 'strongpassword';
GRANT ALL PRIVILEGES ON organisationshandbuch.* TO 'app'@'%';
FLUSH PRIVILEGES;
```

> **Migrations:** This project doesn’t ship with a migrations tool. For first-time setup, you can use the minimal starter schema below and iterate from there.

**Minimal starter schema (core tables):**
```sql
-- users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- navigation
CREATE TABLE navigation_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parent_id INT NULL,
  title VARCHAR(255) NOT NULL,
  type ENUM('folder','document','process') NOT NULL DEFAULT 'document',
  position INT DEFAULT 0,
  emoji VARCHAR(16) NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES navigation_items(id) ON DELETE SET NULL
);

-- documents
CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  navigation_item_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content MEDIUMTEXT,
  updated_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE
);

-- processes
CREATE TABLE processes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  navigation_item_id INT NOT NULL,
  bpmn_xml MEDIUMTEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  updated_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE
);

-- files
CREATE TABLE files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size INT NOT NULL,
  navigation_item_id INT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (navigation_item_id) REFERENCES navigation_items(id) ON DELETE SET NULL
);

-- tags
CREATE TABLE tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) UNIQUE NOT NULL,
  color VARCHAR(16) DEFAULT '#999999'
);
CREATE TABLE document_tags (
  document_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (document_id, tag_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- favorites & recents
CREATE TABLE favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  navigation_item_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_fav (user_id, navigation_item_id)
);
CREATE TABLE recents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  navigation_item_id INT NOT NULL,
  visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- wiki links
CREATE TABLE wiki_links (
  from_navigation_item_id INT NOT NULL,
  to_navigation_item_id INT NOT NULL,
  PRIMARY KEY (from_navigation_item_id, to_navigation_item_id),
  FOREIGN KEY (from_navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE,
  FOREIGN KEY (to_navigation_item_id) REFERENCES navigation_items(id) ON DELETE CASCADE
);

-- compliance & privacy (optional for UI sections)
CREATE TABLE compliance_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE privacy_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- acknowledgements & approvals (for discovery)
CREATE TABLE acknowledgements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE approvals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  decided_at TIMESTAMP NULL
);
```

Seed a user:
```sql
-- Password hash for 'admin' you can generate with bcrypt online or via node
INSERT INTO users (username, password_hash, full_name, role)
VALUES ('admin', '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', 'Administrator', 'admin');
```

### 4) Start development
```bash
# Terminal A (frontend)
cd frontend
npm start

# Terminal B (backend)
cd backend
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000` (in dev you may enable CORS via `CORS_ORIGIN`)

---

## 🚀 Production Deploy (single host on port 8000)

This deployment serves **frontend + API** from the **same Express** server.

### Build & Run
```bash
# Build frontend
cd frontend
npm ci
npm run build

# Start backend (serves /api and frontend build)
cd ../backend
npm ci
NODE_ENV=production node src/server.js
# or: npm run start
```

### Netcup hosting (port 8000)
- Ensure incoming traffic to port **8000** is allowed and forwarded to your instance.
- Access the app at `http://<your-host>:8000`.
- API is available at the same origin under `/api` (no browser CORS issues).

### Health checks
- `GET /health` → `{ status: "OK" }`
- `GET /healthz` → `ok`
- `GET /readyz` → `ready` only if DB is reachable

---

## 🔐 Security & Hardening

- **Helmet + CSP**: default CSP; extend as your asset needs grow.
- **Rate limit**: `/api/auth/login` limited (15 min window / 100 requests).
- **JWT**: store token in `localStorage` (default client). For stricter threat models, consider httpOnly cookies & CSRF protection.
- **Uploads**: extension allowlist (`.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt`) and `MAX_FILE_SIZE` env.
- **Least privilege DB user**: do not use MySQL root from the app.
- **Secrets**: use long random `JWT_SECRET` & `IP_HASH_SECRET`. Rotate periodically.

---

## 🔌 API Overview

> All endpoints are prefixed with `/api`.

**Auth**
- `POST /api/auth/login` → `{ user, token }`
- `GET /api/auth/me` (auth) → user profile

**Navigation**
- `GET /api/navigation/:id`
- `GET /api/navigation/:id/children`
- `GET /api/navigation/:id/breadcrumbs`
- `POST /api/navigation` (auth) → create
- `PATCH /api/navigation/:id` (auth) → update
- `DELETE /api/navigation/:id` (auth) → delete

**Documents**
- `GET /api/documents?navigation_item_id=...`
- `GET /api/documents/:id`
- `POST /api/documents` (auth)
- `PUT /api/documents/:id` (auth)

**Processes**
- `GET /api/processes?navigation_item_id=...`
- `GET /api/processes/:id`
- `POST /api/processes` (auth)
- `PUT /api/processes/:id` (auth)

**Files**
- `GET /api/files[?navigation_item_id=...]`
- `POST /api/files/upload` (auth, multipart `file` + optional `navigation_item_id`)
- `DELETE /api/files/:id` (auth)

**Search**
- `GET /api/search/suggest?q=...`
- `GET /api/search/resolve?titles=A,B,C`
- `GET /api/search/documents?q=...`

**Favorites**
- `GET /api/favorites` (auth)
- `POST /api/favorites` (auth) → `{ navigation_item_id }`
- `DELETE /api/favorites` (auth) → `{ navigation_item_id }`

**Recents**
- `GET /api/recents[?limit=20]` (auth)
- `POST /api/recents` (auth) → `{ navigation_item_id }`

**Tags**
- `GET /api/tags`
- `GET /api/tags/document/:id`
- `POST /api/tags/attach` (auth) → `{ document_id, tag_id }`
- `POST /api/tags/detach` (auth) → `{ document_id, tag_id }`

**Wiki Links**
- `GET /api/wikilinks/:id`
- `POST /api/wikilinks` (auth) → `{ from_navigation_item_id, to_navigation_item_id }`
- `DELETE /api/wikilinks` (auth) → `{ from_navigation_item_id, to_navigation_item_id }`

**Discovery / Compliance / Privacy**
- `GET /api/discovery` (auth)
- `GET /api/compliance` (auth)
- `GET /api/privacy` (auth)

---

## 🧪 Development Tips

- **Linting/format**: Add ESLint + Prettier if you want stricter CI checks.
- **Env switching**: Frontend uses `REACT_APP_API_BASE_URL`; default is `/api` (same-origin). In dev with split ports, set `REACT_APP_API_BASE_URL=http://localhost:8000/api` and restart `npm start`.
- **Logs**: Consider `pino` for structured logs and log rotation for production.
- **Backups**: Regular MySQL dumps; uploads directory (`UPLOAD_DIR`) backup.

---

## 🩺 Troubleshooting

- **White screen after deploy** → Ensure frontend is built: `frontend/build` exists and backend serves it (check server logs).
- **401s everywhere** → Token expired or missing; login again. CORS misconfig in dev? Set `CORS_ORIGIN` correctly.
- **`/readyz` fails** → Database credentials/network incorrect. Verify `.env` and DB is reachable.
- **File upload fails** → Check `MAX_FILE_SIZE` and allowed extensions; see backend logs.

---

## 🗺️ Roadmap Ideas

- Role-based access control (RBAC)
- Document version history & diff
- Full-text search
- LDAP/SSO integration
- Revisions & approvals workflow
- Migrations tool (e.g., Knex or Prisma)

---

## 📄 License

Private / internal. If you plan to open-source, pick a suitable license (MIT/Apache-2.0/etc.).



✨ Magnetic Motion System — Developer Guide

Version: 1.0
Author: Internal Dev Team
Purpose: Create a unified, premium interaction language across all UI components.

🧠 Philosophy

Every interactive element — buttons, links, nav items — should feel alive, responsive, and deliberate.
The goal is subtle tactile motion that enhances usability without distraction.

⚙️ Core Files

| File                                    | Description                                 |
| --------------------------------------- | ------------------------------------------- |
| `styles/magnetic.css`                   | Contains all animation and glow styles      |
| `utils/magneticEffect.js`               | Enables cursor-tracking and parallax motion |
| `components/common/Button.jsx`          | Reusable magnetic + ripple button component |
| `components/Header.jsx` / `Sidebar.jsx` | Navigation examples using magnetic links    |

🎬 Activation
1️⃣ Import the CSS

Any component that uses magnetic elements must import the CSS:

import '../../styles/magnetic.css';

2️⃣ Enable Motion Once

The helper automatically attaches to .magnetic-* classes.
You can activate it in your root layout or each component:

import { useEffect } from 'react';
import { enableMagneticEffect } from '../../utils/magneticEffect';

useEffect(() => {
  enableMagneticEffect();
}, []);

(This can safely be called multiple times — it’s idempotent.)

🧩 Component Types
🔹 Buttons

Use your existing Button component:

<Button variant="primary">Save</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="danger">Delete</Button>

All buttons include:

Magnetic lift and glow

Ripple click feedback

Focus ring for accessibility

To apply it manually:

<Link to="/dashboard" className="magnetic-nav">
  Dashboard
  <span className="magnetic-glow" />
</Link>

Add active class for the current route:

<Link to="/dashboard" className="magnetic-nav active">
  Dashboard
  <span className="magnetic-glow" />
</Link>

🔹 Special Feature Links

Example: Smart Discovery

<Link
  to="/discovery"
  className="magnetic-link flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100 relative overflow-hidden"
>
  <Brain className="w-4 h-4" />
  <span>Smart Discovery</span>
  <span className="magnetic-glow" />
</Link>

🌗 Dark Mode Support

Automatic via prefers-color-scheme: dark media query —
glow adjusts brightness and hue to stay visible without harsh contrast.

🎨 Design Tokens (built-in)

| Element             | Motion            | Glow                        | Interaction      |
| ------------------- | ----------------- | --------------------------- | ---------------- |
| **Buttons**         | scale + translate | radial gradient (blue-tint) | ripple feedback  |
| **Nav Links**       | scale + translate | radial gradient (blue-tint) | soft color shift |
| **Smart Discovery** | parallax follow   | animated glow               | enhanced hover   |
| **Focus States**    | box-shadow ring   | color-adaptive              | WCAG 2.1 AA      |

🚀 Extending the System

Apply classes:
Add .magnetic-nav, .magnetic-button, or .magnetic-link.

Add glow span:

<span class="magnetic-glow"></span>

Activate effect:
Ensure enableMagneticEffect() is running.

Customize color:
Override the glow per component variant using data-variant or Tailwind utilities.

🧰 Troubleshooting

| Issue                        | Cause                                   | Fix                                               |
| ---------------------------- | --------------------------------------- | ------------------------------------------------- |
| Glow not visible             | Forgot `<span class="magnetic-glow" />` | Add the span inside element                       |
| Motion not applied           | Script not active                       | Call `enableMagneticEffect()`                     |
| Ripple not appearing         | Variant missing                         | Ensure `data-variant` attribute present on button |
| Glow too bright in dark mode | Adjust alpha                            | Tune RGBA in `magnetic.css` dark section          |

✅ Example Integration

import React, { useEffect } from 'react';
import { enableMagneticEffect } from '../utils/magneticEffect';
import '../styles/magnetic.css';

export default function Example() {
  useEffect(() => {
    enableMagneticEffect();
  }, []);

  return (
    <div className="space-x-4">
      <button className="magnetic-button bg-blue-600 text-white px-4 py-2 rounded-md relative">
        Primary
        <span className="magnetic-glow" />
      </button>

      <a href="#" className="magnetic-nav">
        Learn More
        <span className="magnetic-glow" />
      </a>
    </div>
  );
}

🧭 Maintenance Notes

All effects are CSS-driven, GPU-accelerated, and mobile-safe.

Keep motion below 1.2 × scale to maintain professional subtlety.

Avoid stacking multiple glow spans per element.

All components follow WCAG 2.1 AA accessibility standards.

💎 Result

Your entire interface — Header, Sidebar, Buttons, Discovery — now shares one premium motion language:

unified cubic-bezier curve

shared color palette

consistent accessibility behavior

A “wow” feel that still loads in under 1 KB CSS + 2 KB JS.





## Production deployment (single host, port 8000)

This setup serves the React build and the API from the **same Express server** (no Docker required).

### 1) Configure environment
Create `backend/.env` based on `backend/.env.example` and set strong secrets.
Make sure `PORT=8000` (the server will listen there).

### 2) Build frontend
```bash
cd frontend
npm ci
npm run build
```

### 3) Start backend (serves API + static UI)
```bash
cd ../backend
npm ci
NODE_ENV=production node src/server.js
# or: npm run start
```

The UI will be available at `http://<your-host>:8000` and the API under the same origin at `/api`.
Uploads are stored under `backend/uploads` (configurable via `UPLOAD_DIR`).

### Health endpoints
- `GET /health` and `GET /healthz` for liveness
- `GET /readyz` returns 200 only if DB connection works
