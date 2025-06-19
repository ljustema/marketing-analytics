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

### Setup

1. Clone the repository
2. Ensure the `data/` and `users/` directories are writable
3. Deploy to Railway or any PHP-compatible hosting

## Usage

1. Register a new account or login
2. Add your monthly marketing data
3. Set your performance thresholds
4. Analyze trends and optimize POAS

## Data Storage

- User data is stored in individual CSV files per user
- Thresholds are stored in JSON files per user
- No database required - simple file-based storage

## Security

- Session-based authentication
- User data isolation
- Secure file handling
