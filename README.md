# 🍽️ Recipe Vault — PWA

A beautiful, offline-capable personal cookbook that works on Android, Windows, and any modern browser.

## Features
- **100+ recipes** — no performance issues, localStorage handles thousands
- **Offline mode** — works without internet after first visit
- **Installable** — "Add to Home Screen" on Android, install prompt on desktop
- **Search & filter** — instant search, 9 categories, favorites, sorting
- **Import/Export** — backup as JSON, share between devices
- **Zero dependencies** — pure HTML/CSS/JS, no build step

## Deploy in 2 Minutes

### Option A: Vercel (recommended, free)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New → Project"**
3. Upload this folder (or push to GitHub first)
4. Click **Deploy** — done! You get a URL like `recipe-vault.vercel.app`

### Option B: Netlify (free)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the **entire `recipe-vault-pwa` folder** onto the deploy area
3. Done — instant URL

### Option C: GitHub Pages (free)
1. Create a repo, push all files
2. Go to Settings → Pages → Source: `main` branch
3. Your app is at `https://yourusername.github.io/repo-name`

### Option D: Local / LAN
```bash
# Python (built-in)
cd recipe-vault-pwa
python3 -m http.server 8080

# Then open http://localhost:8080
# On same WiFi, other devices: http://YOUR_IP:8080
```

## Install as App

### Android
1. Open the deployed URL in Chrome
2. Tap the **"Install"** banner or: ⋮ menu → "Add to Home Screen"
3. App appears on your home screen with its own icon

### Windows / Desktop
1. Open in Chrome or Edge
2. Click the install icon (⊕) in the address bar
3. Or use the in-app install banner

## File Structure
```
recipe-vault-pwa/
├── index.html      ← entry point
├── style.css       ← all styles
├── app.js          ← full app logic
├── sw.js           ← service worker (offline)
├── manifest.json   ← PWA manifest (installability)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── README.md
```

## Data Storage
All recipes live in `localStorage`. This means:
- Data persists across sessions and reboots
- Data is per-device (not synced between devices)
- Use **Export/Import** to transfer recipes between devices
- Capacity: ~5MB ≈ roughly 5,000–10,000 recipes
