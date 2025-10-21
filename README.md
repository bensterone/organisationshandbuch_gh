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
