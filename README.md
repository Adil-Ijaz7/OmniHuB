# OmniHub - Multi-Tool Platform

## Overview
OmniHub is a comprehensive multi-tool platform that provides various digital services accessible through a credit-based system managed by administrators.

## Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT

## Features

### User Tools (Credit-Based)
| Tool | Description | Credit Cost |
|------|-------------|-------------|
| Live TV | Stream live TV channels via HLS | 1 credit/stream |
| Tamasha OTP | OTP activation service | 2 credits |
| Temp Email | Temporary email generation | 1 credit |
| YouTube Download | Get YouTube video info & links | 3 credits |
| Image Enhance | Image enhancement service | 2 credits |
| Phone Lookup | Database phone number lookup | 1 credit |
| Eyecon Lookup | Phone to name lookup | 1 credit |

### Admin Features
- User Management (view, suspend/unsuspend)
- Credit Management (assign/deduct credits)
- Usage Logs (all tool usage across platform)
- Credit Transaction Logs

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/credits` - Update user credits
- `POST /api/admin/users/{id}/suspend` - Toggle user suspension
- `GET /api/admin/usage-logs` - Get usage logs
- `GET /api/admin/credit-logs` - Get credit transaction logs

### Tools
- `POST /api/tools/phone-lookup` - Phone database lookup
- `POST /api/tools/eyecon-lookup` - Eyecon name lookup
- `POST /api/tools/temp-email` - Generate/check temp email
- `POST /api/tools/youtube-download` - YouTube video info
- `POST /api/tools/image-enhance` - Image enhancement
- `POST /api/tools/tamasha-otp` - Tamasha OTP service
- `GET /api/tools/live-tv/channels` - List TV channels
- `GET /api/tools/live-tv/stream/{id}` - Get stream URL

### User
- `GET /api/user/usage-history` - User's usage history

## Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=omnihub_database
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
ADMIN_EMAIL=admin@omnihub.com
ADMIN_PASSWORD=Admin@123
EYECON_E_AUTH_V=REPLACE_ME
EYECON_E_AUTH=REPLACE_ME
EYECON_E_AUTH_C=REPLACE_ME
EYECON_E_AUTH_K=REPLACE_ME
```

### Frontend (.env)
```
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

## Notes
- Users start with 0 credits (admin must assign)
- Eyecon API requires valid headers (placeholders provided)
- Tamasha OTP is simulated (needs real integration)
- Image Enhancement is placeholder (needs real service)
- Live TV uses test HLS streams (replace with real streams)
