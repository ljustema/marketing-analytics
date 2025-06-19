# Deployment Guide

## Prerequisites

1. GitHub account (https://github.com/ljustema)
2. Railway account (https://railway.app)
3. Git installed locally

## Step 1: Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Marketing Analytics with multi-user support"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/ljustema
2. Click "New repository"
3. Name: `marketing-analytics`
4. Description: `Marketing Analytics Dashboard with POAS optimization and multi-user support`
5. Set to Public or Private as preferred
6. Don't initialize with README (we already have one)
7. Click "Create repository"

## Step 3: Connect Local Repository to GitHub

```bash
git remote add origin https://github.com/ljustema/marketing-analytics.git
git branch -M main
git push -u origin main
```

## Step 4: Deploy to Railway

1. Go to https://railway.app
2. Sign in with GitHub account
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose the `marketing-analytics` repository
6. Railway will automatically detect the PHP configuration
7. The app will deploy using the `nixpacks.toml` configuration

## Step 5: Configure Environment (if needed)

Railway should automatically:
- Install PHP 8.2 with required extensions
- Create the data and users directories
- Start the PHP server on the correct port

## Step 6: Access Your Application

Once deployed, Railway will provide a URL like:
`https://marketing-analytics-production-xxxx.up.railway.app`

## Features Included

✅ **Multi-User Authentication**
- User registration and login
- Session-based authentication
- Secure password hashing

✅ **Isolated User Data**
- Each user gets their own CSV data file
- Individual threshold configurations
- Complete data separation

✅ **All Original Features**
- POAS and ROAS analytics
- Predictive analytics
- Interactive charts
- Swedish interface
- Dark mode support

## File Structure

```
marketing-analytics/
├── auth.php              # Authentication system
├── data.php              # User data API
├── thresholds.php         # User thresholds API
├── login.html             # Login/register page
├── index.html             # Main application
├── script.js              # Main JavaScript (with auth)
├── styles.css             # Styling
├── analytics/             # POAS analytics system
├── data/                  # Sample data
├── users/                 # User data storage
├── railway.json           # Railway configuration
├── nixpacks.toml          # Build configuration
└── README.md              # Documentation
```

## Security Features

- Session-based authentication
- Password hashing with PHP's password_hash()
- User data isolation
- Input validation
- CSRF protection through session management

## Troubleshooting

If deployment fails:
1. Check Railway logs for errors
2. Ensure all files are committed to Git
3. Verify PHP syntax with `php -l filename.php`
4. Check file permissions for data directories
