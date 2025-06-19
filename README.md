# Marketing Analytics Dashboard

A comprehensive marketing analytics dashboard for tracking POAS (Profit on Ad Spend), ROAS, and other key marketing metrics.

## Features

- **Multi-User Support**: Each user has their own data and thresholds
- **Advanced Analytics**: POAS prediction and optimization
- **Data Management**: CSV-based data storage with threshold management
- **Visualization**: Interactive charts and trend analysis
- **Swedish Interface**: Fully localized Swedish user interface

## Deployment

This application is designed to be deployed on Railway with PHP support.

### Requirements

- PHP 7.4 or higher
- Web server with PHP support
- File system write permissions for user data

### Development

### Quick Start
```bash
# Run all checks (lint + build)
make test

# Start development server
make serve

# Or using PHP directly:
php scripts/run.php test
php scripts/run.php serve
```

### Available Commands
```bash
make lint     # Check PHP syntax and common issues
make build    # Verify deployment readiness
make test     # Run all checks (lint + build)
make serve    # Start development server
make clean    # Clean temporary files
make install  # Set up project directories
```

## Setup

1. Clone the repository
2. Run `make install` to set up directories and permissions
3. Run `make test` to verify everything is working
4. Deploy to Railway or any PHP-compatible hosting

## Usage

1. Register a new account or login
2. Add your monthly marketing data
3. Set your performance thresholds
4. Analyze trends and optimize POAS

## Data Storage

- User data is stored in individual CSV files per user (`users/{user_id}/data.csv`)
- Thresholds are stored in JSON files per user (`users/{user_id}/thresholds.json`)
- No database required - simple file-based storage
- Automatic CSV header creation for new users
- Backward compatibility with old field names

## File Structure

```
marketing-analytics/
├── index.php               # Main entry point with routing
├── templates/              # HTML templates
│   ├── index.html          # Main application interface
│   └── login.html          # Authentication page
├── src/                    # Source assets
│   ├── script.js           # Main application logic
│   └── styles.css          # Application styling
├── api/                    # Backend API endpoints
│   ├── auth.php            # Authentication API
│   ├── data.php            # User data API
│   └── thresholds.php      # User thresholds API
├── analytics/              # POAS analytics system
│   ├── poas-analytics.js   # Main analytics engine
│   ├── poas-predictor.js   # ML prediction algorithms
│   ├── poas-charts.js      # Specialized charts
│   ├── poas-analytics.css  # Analytics styling
│   ├── poas-interface.js   # Analytics UI
│   └── poas-utils.js       # Utility functions
├── data/                   # Sample data files
│   ├── sample_data.csv     # Sample marketing data
│   └── sample_thresholds.json # Sample thresholds
├── users/                  # User data storage
│   ├── {user_id}/          # Individual user directories
│   │   ├── data.csv        # User's marketing data
│   │   └── thresholds.json # User's threshold settings
│   └── users.json          # User accounts
├── docs/                   # Documentation
├── public/                 # Static assets (future use)
├── railway.json            # Railway deployment config
├── nixpacks.toml          # Build configuration
└── README.md              # This file
```

## Security

- Session-based authentication
- User data isolation in separate directories
- Secure file handling with proper validation
- Input sanitization and validation
