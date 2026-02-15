# Dumb Luck Cup - Deployment Instructions

## Quick Deploy to Vercel (Recommended - 5 minutes)

### Option 1: Using Vercel CLI (Easiest)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Deploy:**
   ```bash
   cd dumb-luck-app
   vercel
   ```

3. Follow the prompts (just press Enter for defaults)
4. Your app will be live at a vercel.app URL!

### Option 2: Using Vercel Website (No coding needed)

1. **Go to:** https://vercel.com/signup
2. **Sign up** with GitHub, GitLab, or Bitbucket (free account)
3. **Click "Add New Project"**
4. **Upload this entire `dumb-luck-app` folder**
5. Vercel will auto-detect it's a Vite/React app
6. Click **"Deploy"**
7. Done! You'll get a live URL

### Option 3: GitHub + Vercel (Best for updates)

1. **Create a GitHub account** (if you don't have one)
2. **Upload this folder to a new GitHub repo**
3. **Go to Vercel.com** and sign in with GitHub
4. **Import your repository**
5. Click Deploy
6. Every time you push to GitHub, it auto-deploys!

## Features

- ✅ Auto-fetch NFL Week 12 2024 + NCAA games
- ✅ Yahoo Sports Spread display
- ✅ Team helmet badges
- ✅ Leaderboard
- ✅ Commissioner tools
- ✅ Pick tracking

## Commissioner Login

- Username: `commissioner`
- Password: `dlcadmin2025`

## Note

Currently uses in-memory storage (resets on refresh). To add persistence, you'll need to set up a database like Supabase or Firebase (I can help with that later).
