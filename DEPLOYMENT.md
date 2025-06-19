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
├── index.php              # Main entry point with routing
├── templates/             # HTML templates
│   ├── index.html         # Main application interface
│   └── login.html         # Authentication page
├── src/                   # Source assets
│   ├── script.js          # Main application logic
│   └── styles.css         # Application styling
├── api/                   # Backend API endpoints
│   ├── auth.php           # Authentication API
│   ├── data.php           # User data API (with CSV header support)
│   └── thresholds.php     # User thresholds API (complete defaults)
├── analytics/             # POAS analytics system
│   ├── poas-analytics.js  # Main analytics engine
│   ├── poas-predictor.js  # ML prediction algorithms
│   ├── poas-charts.js     # Specialized charts
│   ├── poas-analytics.css # Analytics styling
│   ├── poas-interface.js  # Analytics UI
│   └── poas-utils.js      # Utility functions
├── data/                  # Sample data (cleaned field names)
│   ├── sample_data.csv    # Sample marketing data
│   └── sample_thresholds.json # Sample thresholds
├── users/                 # User data storage (auto-created)
│   ├── {user_id}/         # Individual user directories
│   │   ├── data.csv       # User's marketing data
│   │   └── thresholds.json # User's threshold settings
│   └── users.json         # User accounts
├── docs/                  # Documentation
├── public/                # Static assets (future use)
├── railway.json           # Railway configuration
├── nixpacks.toml          # Build configuration (with permissions)
└── README.md              # Updated documentation
```

**Recent Cleanup Changes:**
- ✅ Fixed CSV field naming consistency (`marketingSpend` vs `marknadsföring`)
- ✅ Added automatic CSV header creation for new users
- ✅ Updated default thresholds to include all required fields
- ✅ Reorganized file structure with proper directories
- ✅ Created clean separation: templates/, src/, api/, public/
- ✅ Added main index.php with routing for clean URLs
- ✅ Updated all file references to work with new structure
- ✅ Cleaned up empty user directories
- ✅ Enhanced data persistence and error handling
- ✅ Updated documentation and deployment guides

## Pre-Deployment Checklist

Before deploying to Railway, ensure:

- [ ] All user data directories are properly isolated
- [ ] CSV files use consistent field names (`marketingSpend` not `marknadsföring`)
- [ ] Default thresholds include all required fields
- [ ] Authentication system is working correctly
- [ ] File permissions are set correctly (755 for directories)
- [ ] .gitignore excludes sensitive files and user data
- [ ] No unused files remain in the repository

## Deployment Steps

1. **Push to GitHub**: Ensure all changes are committed and pushed
2. **Connect to Railway**: Link your GitHub repository to Railway
3. **Environment Setup**: Railway will automatically detect PHP and use nixpacks.toml
4. **Verify Deployment**: Test authentication and data persistence after deployment

## Post-Deployment Verification

1. **Test User Registration**: Create a new account
2. **Test Data Entry**: Add marketing data for a month
3. **Test Threshold Settings**: Modify and save threshold values
4. **Test Analytics**: Verify all charts and analytics work correctly
5. **Test Data Persistence**: Logout and login to verify data is saved

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
