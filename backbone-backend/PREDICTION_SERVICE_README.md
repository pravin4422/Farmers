# Crop Prediction Backend Service

## Overview
Simple backend service for crop and yield prediction system that forwards requests to an ML service.

## Architecture
- **Backend API** (Port 5000): Handles authentication and forwards requests
- **ML Service** (Port 5001): Processes predictions and returns results

## Setup Instructions

### 1. Install Dependencies
```bash
cd backbone-backend
npm install axios
```

### 2. Update .env File
Add the following to your `.env` file:
```
ML_SERVICE_URL=http://localhost:5001
```

### 3. Start Services

**Terminal 1 - Start ML Service:**
```bash
node ml-service.js
```

**Terminal 2 - Start Backend:**
```bash
node server.js
```

**Terminal 3 - Start Frontend:**
```bash
cd ../frontend
npm start
```

## API Endpoints

### Crop Prediction
**POST** `/api/predict/crop`

**Request Body:**
```json
{
  "state": "Tamil Nadu",
  "district": "ARIYALUR",
  "season": "KHARIF",
  "year": "2008",
  "area": "1298"
}
```

**Response:**
```json
{
  "crop": "Rice"
}
```

### Yield Prediction
**POST** `/api/predict/yield`

**Request Body:**
```json
{
  "country": "India",
  "state": "Tamil Nadu",
  "season": "KHARIF",
  "year": "2002",
  "area": "3140"
}
```

**Response:**
```json
{
  "yield": "2500 kg/hectare"
}
```

## Data Flow
1. Frontend sends prediction request with form data
2. Backend validates and authenticates request
3. Backend forwards data to ML service
4. ML service processes and returns prediction
5. Backend returns result to frontend in JSON format

## Notes
- Authentication required (JWT token)
- ML service uses mock data for demonstration
- Replace ML service with actual trained model for production
