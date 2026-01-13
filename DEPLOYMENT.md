# Lynx's Sari-sari Store - Deployment Guide

## Deployment to Render.com

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Setup on Render.com

1. Go to [Render.com](https://render.com) and sign in
2. Click "New +" and select "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Build Settings:**
- **Name**: lynx-sarisari-store
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `NODE_ENV=production npm start`

**Environment Variables:**
Add these in the Render dashboard:
- `NODE_ENV` = `production`
- `MONGODB_URI` = `your-mongodb-connection-string`
- `JWT_SECRET` = `your-secure-jwt-secret`
- `PORT` = `10000` (or leave empty, Render auto-assigns)

### 3. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Add IP Address: `0.0.0.0/0` (allow from anywhere)
4. Get connection string and add to Render environment variables

### 4. Deploy

Click "Create Web Service" and Render will automatically:
- Install backend dependencies
- Install frontend dependencies
- Build the React app
- Start the Node.js server

Your app will be live at: `https://your-app-name.onrender.com`

## Local Development

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend (separate terminal):**
```bash
cd frontend
npm run dev
```

## Production Build (Local Testing)

```bash
cd frontend
npm run build
cd ../backend
NODE_ENV=production npm start
```

Visit: `http://localhost:5000`
