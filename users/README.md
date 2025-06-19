# Users Directory

This directory will contain individual user data folders.

Each user gets a unique folder based on their user ID:

```
users/
├── [user_id_1]/
│   ├── data.csv
│   └── thresholds.json
├── [user_id_2]/
│   ├── data.csv
│   └── thresholds.json
└── users.json (user accounts database)
```

## Security

- Each user can only access their own data
- User authentication is required for all data operations
- File permissions ensure data isolation
