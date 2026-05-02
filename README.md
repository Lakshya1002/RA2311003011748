# Backend Microservices Project  
### (Logging Middleware + Vehicle Scheduler + Notification System)

## Project Overview
This project is a backend system built using **Node.js** that demonstrates:
- Custom **Logging Middleware**
- **Vehicle Maintenance Scheduler** using DSA (Knapsack Algorithm)
- **Campus Notification Microservice**

The system follows a **microservices-based architecture** and integrates with external APIs for evaluation.

---

## Tech Stack
- Node.js
- Express.js
- Axios
- REST APIs

---

## Project Structure

notification_app_be/
│
├── logging_middleware/
├── vehicle_maintenance_scheduler/
├── priorityInbox.js
├── package.json
├── .gitignore
└── README.md

---

## Features

### 1. Logging Middleware
- Centralized logging system
- Sends logs to external evaluation API
- Supports:
  - Levels: debug, info, warn, error, fatal
  - Stack: backend/frontend
  - Packages: controller, service, route, etc.

---

### 2. Vehicle Maintenance Scheduler
- Implements **0/1 Knapsack Algorithm**
- Optimizes:
  - Maximum impact
  - Within limited working hours
- Fetches data from APIs dynamically

---

### 3. Notification System
- Priority-based inbox system
- Handles event-driven notifications
- Clean backend modular structure

---

## Setup Instructions

### Clone Repository
git clone https://github.com/Lakshya1002/RA2311003011748.git
cd RA2311003011748/notification_app_be

---

### Install Dependencies
npm install

---

### Add Environment Variables
Create `.env` file:

TOKEN=your_access_token_here

---

### Run Project
node priorityInbox.js

---

## Important Notes

- Do NOT use console.log
- Use logging middleware for all logs
- Do NOT upload node_modules
- Ensure .gitignore is properly configured

---

## API Integration
- Registration API
- Auth Token API
- Logging API
- Vehicle Data API

---

## Algorithm Used

### 0/1 Knapsack Problem
Maximize: Impact  
Constraint: Total Duration ≤ Available Hours

---



