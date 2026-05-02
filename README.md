# RA2311003011748 Project

This repository contains three main components:

## 1. Logging Middleware
A Node.js middleware for logging requests and responses. Useful for tracking and debugging application behavior.
- **Location:** `logging_middleware/`
- **How to install:**
  ```sh
  cd logging_middleware
  npm install
  ```
- **How to use:**
  Import and use the middleware in your Node.js application.

## 2. Notification App Backend
A backend service for managing notifications, including a priority inbox system.
- **Location:** `notification_app_be/`
- **How to install dependencies:**
  ```sh
  cd notification_app_be
  npm install
  ```
- **How to run:**
  ```sh
  node priorityInbox.js
  ```
- **Features:**
  - Priority inbox management
  - Notification handling

## 3. Vehicle Maintenance Scheduler
A backend service for scheduling and managing vehicle maintenance tasks.
- **Location:** `vehicle_maintence_scheduler/`
- **How to install dependencies:**
  ```sh
  cd vehicle_maintence_scheduler
  npm install
  ```
- **How to run:**
  ```sh
  node index.js
  ```
- **Features:**
  - Schedule maintenance
  - Track vehicle service history

## General Notes
- Each subproject has its own `package.json` and should be installed separately.
- Make sure Node.js is installed on your system.
- `.gitignore` files are present to exclude `node_modules` and other unnecessary files from version control.

## Screenshots
Screenshots for the vehicle maintenance scheduler can be found in `vehicle_maintence_scheduler/screenshots/`.

---
