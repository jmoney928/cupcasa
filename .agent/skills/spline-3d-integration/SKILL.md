---
name: spline-3d-integration
description: "Use when adding interactive 3D scenes from Spline.design to web projects. Covers embedding methods (React, Next.js, vanilla JS), the @splinetool/runtime API for programmatic control (events, variables, animations, camera), performance optimization, and common integration patterns like hero sections, product viewers, and scroll-driven 3D."
trigger: "spline-3d-integration" or "add spline" or "embed spline" or "3d scene"
---

# Spline 3D Integration

Master guide for embedding interactive 3D scenes from [Spline.design](https://spline.design) into web projects.

---

## What Is Spline?

Spline is a **browser-based 3D design tool** — think of it as Figma, but for 3D. Designers create interactive 3D scenes (objects, materials, animations, physics, events) in the Spline editor, then export them for the web.

- **Free tier** available (with watermark)
- Scenes are hosted by Spline and loaded at runtime
- Supports mouse, scroll, keyboard, and touch interactions
- Built on WebGL — works in all modern browsers

---

## Integration Methods

There are **3 ways** to embed a Spline scene. Choose based on your stack:

| Method | Best For | Package |
|--------|----------|---------|
| **React Component** | React / Next.js apps | `@splinetool/react-spline` |
| **Vanilla JS Runtime** | Plain HTML/JS, Webflow, any framework | `@splinetool/runtime` |
| **iframe Embed** | Quick embeds, no-code sites, CMS | None (just a URL) |

### Decision Guide

```
Is this a React or Next.js project?
  → YES: Use @splinetool/react-spline
  → NO:
      Do you need programmatic control (events, variables, animations)?
        → YES: Use @splinetool/runtime
        → NO: Use iframe embed (simplest option)
```

---

## Quick Start

### Getting the Scene URL

1. Open your scene in the **Spline editor**
2. Click **Export** (top-right)
3. Select **Code**
4. Choose **React** or **Vanilla JS**
5. Copy the scene URL — it looks like:
   ```
   https://prod.spline.design/aBcDeFgHiJkLmNoP/scene.splinecode
   ```

> **Important:** The URL contains a unique scene ID. Each time you re-export, Spline generates a new URL. Use the latest one.

### React (10 lines)

```bash
npm install @splinetool/react-spline @splinetool/runtime
```

```tsx
import Spline from '@splinetool/react-spline';

export default function MyScene() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Spline scene="https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode" />
    </div>
  );
}
```

### Vanilla JS (10 lines)

```html
<canvas id="canvas3d" style="width: 100%; height: 100vh;"></canvas>
<script type="module">
  import { Application } from 'https://esm.sh/@splinetool/runtime';

  const canvas = document.getElementById('canvas3d');
  const spline = new Application(canvas);
  spline.load('https://prod.spline.design/YOUR_SCENE_ID/scene.splinecode')
    .then(() => console.log('Scene loaded!'));
</script>
```

### iframe (1 line)

```html
<iframe src="https://my.spline.design/YOUR_SCENE_ID/" width="100%" height="600" frameborder="0"></iframe>
```

---

## Runtime API — Key Methods

Once a scene is loaded, you can interact with it programmatically. These methods work in **both** React (via `onLoad` callback) and vanilla JS (via the `Application` instance).

### Getting a Reference

**React:**
```tsx
function handleLoad(splineApp) {
  const cube = splineApp.findObjectByName('Cube');
}

<Spline scene="..." onLoad={handleLoad} />
```

**Vanilla JS:**
```js
spline.load('...').then(() => {
  const cube = spline.findObjectByName('Cube');
});
```

### Object Queries

| Method | What It Does |
|--------|-------------|
| `findObjectByName('name')` | Find an object by its name in the Spline editor |
| `findObjectById('uuid')` | Find an object by its unique ID |
| `getAllObjects()` | Get an array of all objects in the scene |

### Triggering Events

```js
splineApp.emitEvent('mouseDown', 'Cube');
splineApp.emitEventReverse('mouseDown', 'object-uuid');
```

**Supported event types:** `mouseDown`, `mouseUp`, `mouseHover`, `keyDown`, `keyUp`, `start`, `lookAt`, `follow`

### Listening to Events

```js
splineApp.addEventListener('mouseDown', (e) => {
  console.log('Clicked:', e.target.name);
});
```

### Variables

```js
const score = splineApp.getVariable('score');
splineApp.setVariable('score', 42);
splineApp.setVariable('isActive', true);
```

### Object Properties (Direct Manipulation)

```js
const cube = splineApp.findObjectByName('Cube');
cube.position.x = 2;
cube.rotation.y = Math.PI / 4;
cube.scale.x = 1.5;
```

---

## Common Patterns

### 1. Hero Section with 3D Scene

```tsx
<div className="hero">
  <div className="hero-text">
    <h1>Welcome</h1>
  </div>
  <div className="hero-3d">
    <SplineScene scene="https://prod.spline.design/.../scene.splinecode" />
  </div>
</div>
```

Always lazy-load, show a skeleton while loading, stack vertically on mobile.

### 2. Interactive Product Viewer

```tsx
function ProductViewer({ sceneUrl }) {
  const handleLoad = (app) => {
    app.addEventListener('mouseDown', (e) => {
      if (e.target.name === 'Hotspot_1') showProductDetail('screen');
    });
  };
  return <Spline scene={sceneUrl} onLoad={handleLoad} />;
}
```

### 3. Scroll-Driven 3D

```js
window.addEventListener('scroll', () => {
  const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  splineApp.setVariable('scrollProgress', scrollPercent);
});
```

### 4. Data-Driven 3D Dashboard

```js
async function updateDashboard() {
  const data = await fetch('/api/metrics').then(r => r.json());
  splineApp.setVariable('revenue', data.revenue);
  splineApp.setVariable('users', data.activeUsers);
}
setInterval(updateDashboard, 5000);
```

---

## Performance Best Practices

| # | Rule | Why |
|---|------|-----|
| 1 | **Max 150k polygons** per scene | More polygons = slower rendering |
| 2 | **≤ 3 lights** per scene | Each light multiplies GPU work |
| 3 | **Enable geometry compression** on export | Reduces file size 50-80% |
| 4 | **Lazy-load scenes below the fold** | Don't load what's not visible |
| 5 | **One complex scene per page** max | Multiple scenes compete for GPU |
| 6 | **Delete hidden/unused objects** | They still get loaded |
| 7 | **Use Matcap materials** over complex lighting | Fakes shading without GPU cost |
| 8 | **Consider image/video fallback** for non-interactive scenes | |

### Lazy Loading Pattern (React)

```tsx
import { Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

export function SplineScene({ scene, className }) {
  return (
    <Suspense fallback={<div className="spinner" />}>
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}
```

---

## Gotchas & Troubleshooting

### CORS Issues
Self-host the `.splinecode` file instead of using Spline's CDN URL.

### Version Mismatches
Install both packages together: `npm install @splinetool/react-spline@latest @splinetool/runtime@latest`

### Scene Shows Blank White
Parent container has no height. Fix:
```css
.spline-container { width: 100%; height: 100vh; }
```

### Mobile Performance
Reduce polygons under 50k, use 1-2 lights, or show a static image on mobile:
```tsx
if (window.innerWidth < 768) return <img src={fallbackImage} />;
return <SplineScene scene={scene} />;
```

### Loading UX
```tsx
function SceneWithLoader({ scene }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div>
      {!loaded && <div className="spinner" />}
      <Spline scene={scene} onLoad={() => setLoaded(true)}
        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s' }} />
    </div>
  );
}
```
