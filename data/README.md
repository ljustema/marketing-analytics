# Data Directory

This directory contains sample data files for the Marketing Analytics application.

## Files

- `sample_data.csv` - Sample marketing data
- `sample_thresholds.json` - Sample threshold configuration

## User Data

When users register and use the application, their individual data files will be stored in the `users/` directory with the following structure:

```
users/
├── [user_id]/
│   ├── data.csv
│   └── thresholds.json
```

Each user gets their own isolated data storage.
