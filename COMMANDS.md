# ⚡ Quick Command Reference

## Essential Commands for Your Expense Tracker

---

## 🚀 Development

### Start Development Server
```bash
npm run dev
```
Opens app at `http://localhost:5173`

### Stop Server
Press `Ctrl + C` in terminal

---

## 📦 Build & Preview

### Build for Production
```bash
npm run build
```
Creates optimized `dist` folder

### Preview Production Build
```bash
npm run preview
```
Test production build locally

---

## 📝 Git Commands

### Initialize Repository
```bash
git init
git add .
git commit -m "Initial commit"
```

### Push to GitHub
```bash
git remote add origin YOUR_REPO_URL
git branch -M main
git push -u origin main
```

### Update Repository
```bash
git add .
git commit -m "Your commit message"
git push
```

---

## 🔥 Firebase Commands

### Install Firebase CLI
```bash
npm install -g firebase-tools
```

### Login to Firebase
```bash
firebase login
```

### Initialize Hosting
```bash
firebase init hosting
```

### Deploy to Firebase
```bash
npm run build
firebase deploy --only hosting
```

---

## 📦 Package Management

### Install Dependencies
```bash
npm install
```

### Install New Package
```bash
npm install package-name
```

### Update Packages
```bash
npm update
```

### Check for Outdated Packages
```bash
npm outdated
```

---

## 🧹 Cleanup

### Remove node_modules
```bash
# Windows
rmdir /s /q node_modules

# Mac/Linux
rm -rf node_modules
```

### Clean Install
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🔍 Debugging

### Check for Errors
```bash
npm run lint
```

### View Package Info
```bash
npm list
```

### Check Node Version
```bash
node --version
```

### Check npm Version
```bash
npm --version
```

---

## 🌐 Deployment Commands

### Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production Deploy
vercel --prod
```

### Netlify
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy

# Production Deploy
netlify deploy --prod
```

---

## 📊 Project Info

### View Scripts
```bash
npm run
```

### View Dependencies
```bash
npm list --depth=0
```

---

## 🛠️ Troubleshooting

### Clear npm Cache
```bash
npm cache clean --force
```

### Reinstall Everything
```bash
rm -rf node_modules package-lock.json
npm install
```

### Fix Permissions (Mac/Linux)
```bash
sudo chown -R $USER ~/.npm
```

---

## 📱 Testing

### Open in Browser
Development: `http://localhost:5173`
Preview: `http://localhost:4173`

### Test on Mobile
1. Find your local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Open `http://YOUR_IP:5173` on mobile

---

## 🔐 Environment Variables

### Create .env File
```bash
# Windows
type nul > .env

# Mac/Linux
touch .env
```

### Edit .env
Add your Firebase config:
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 📂 File Operations

### Create New Component
```bash
# Windows
type nul > src\components\ComponentName.jsx

# Mac/Linux
touch src/components/ComponentName.jsx
```

### View File Structure
```bash
# Windows
tree /F

# Mac/Linux
tree
```

---

## 🎯 Quick Workflow

### Daily Development
```bash
# 1. Start dev server
npm run dev

# 2. Make changes
# Edit files in your code editor

# 3. Test in browser
# Open http://localhost:5173

# 4. Commit changes
git add .
git commit -m "Description of changes"
git push
```

### Before Deployment
```bash
# 1. Build
npm run build

# 2. Preview
npm run preview

# 3. Test thoroughly

# 4. Deploy
# Use Vercel, Netlify, or Firebase
```

---

## 🆘 Common Issues

### Port Already in Use
```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5173 | xargs kill
```

### Module Not Found
```bash
npm install
```

### Build Fails
```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

---

## 📚 Useful Links

- **Vite Docs**: https://vitejs.dev/
- **React Docs**: https://react.dev/
- **Tailwind Docs**: https://tailwindcss.com/
- **Firebase Docs**: https://firebase.google.com/docs
- **Recharts Docs**: https://recharts.org/

---

## 💡 Pro Tips

### Faster Development
```bash
# Use --host to access from other devices
npm run dev -- --host
```

### Check Bundle Size
```bash
npm run build
# Check dist folder size
```

### Auto-format Code
```bash
# Install Prettier
npm install -D prettier

# Format all files
npx prettier --write .
```

---

## 🎉 Quick Start (New Setup)

```bash
# 1. Clone/Download project
cd expense-tracker

# 2. Install dependencies
npm install

# 3. Add Firebase config
# Edit src/firebase/config.js

# 4. Start development
npm run dev

# 5. Open browser
# http://localhost:5173
```

---

**Keep this file handy for quick reference! 🚀**
