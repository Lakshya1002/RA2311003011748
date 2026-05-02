# Notification System Design

---

## Stage 1

### REST API Design for Campus Notification Platform

#### Base URL
```
http://localhost:3002
```

#### Authentication
All endpoints require Bearer token in header:
```
Authorization: Bearer <token>
```

---

### Endpoints

#### 1. Get All Notifications for a Student
```
GET /notifications
```
**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```
**Query Params:**
```
?studentID=1042&type=Placement&isRead=false&page=1&limit=10
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "Placement",
      "message": "TCS is hiring",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:30Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10
}
```

---

#### 2. Get Single Notification
```
GET /notifications/:id
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "Placement",
    "message": "TCS is hiring",
    "isRead": false,
    "createdAt": "2026-04-22T17:51:30Z"
  }
}
```

---

#### 3. Create Notification
```
POST /notifications
```
**Request Body:**
```json
{
  "type": "Placement",
  "message": "TCS is hiring",
  "targetAudience": ["all"]
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "Placement",
    "message": "TCS is hiring",
    "isRead": false,
    "createdAt": "2026-04-22T17:51:30Z"
  }
}
```

---

#### 4. Mark Notification as Read
```
PATCH /notifications/:id/read
```
**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

#### 5. Mark All Notifications as Read
```
PATCH /notifications/read-all
```
**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

#### 6. Delete Notification
```
DELETE /notifications/:id
```
**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

#### 7. Notify All Students (Bulk)
```
POST /notifications/notify-all
```
**Request Body:**
```json
{
  "type": "Placement",
  "message": "Campus drive tomorrow"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Notifications queued for 50000 students"
}
```

---

### Real-Time Notification Mechanism

For real-time delivery, **WebSockets** via **Socket.IO** is used:

- When a student logs in, they connect to the WebSocket server
- Server emits `notification` event whenever a new notification is created for that student
- Client listens and displays notification instantly without polling

```
ws://localhost:3002/socket
```

Events:
- `connect` - student connects with their studentID
- `notification` - server sends new notification to student
- `disconnect` - student disconnects

---

## Stage 2

### Persistent Storage - Database Design

#### Recommended Database: **PostgreSQL**

**Why PostgreSQL over NoSQL:**
- Notifications have structured, predictable schema
- We need complex queries (filter by type, studentID, isRead, date)
- ACID compliance ensures no notification is lost
- Better for relational data (students → notifications)

---

### DB Schema

```sql
-- Students table
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('Placement', 'Event', 'Result')),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
-- Student Notifications 
CREATE TABLE student_notifications (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```
---
### Problems as Data Volume Increases

1. **Full table scans** - querying unread notifications without indexes is O(n)
2. **Junction table grows huge** - 50,000 students × 5,000,000 notifications
3. **Slow ORDER BY createdAt** without index
4. **Connection pool exhaustion** under high load

---

### SQL Queries based on REST APIs

**Get unread notifications for a student:**
```sql
SELECT n.id, n.type, n.message, n.created_at, sn.is_read
FROM student_notifications sn
JOIN notifications n ON sn.notification_id = n.id
WHERE sn.student_id = $1 AND sn.is_read = false
ORDER BY n.created_at DESC
LIMIT $2 OFFSET $3;
```

**Mark notification as read:**
```sql
UPDATE student_notifications
SET is_read = TRUE, read_at = NOW()
WHERE student_id = $1 AND notification_id = $2;
```

**Mark all as read:**
```sql
UPDATE student_notifications
SET is_read = TRUE, read_at = NOW()
WHERE student_id = $1 AND is_read = FALSE;
```

**Get notifications by type:**
```sql
SELECT n.id, n.type, n.message, n.created_at
FROM student_notifications sn
JOIN notifications n ON sn.notification_id = n.id
WHERE sn.student_id = $1 AND n.type = $2
ORDER BY n.created_at DESC;
```

---

## Stage 3

### Query Optimization

#### Original slow query:
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

#### Is this query accurate?
**No.** Problems:
- `SELECT *` fetches all columns including large text fields unnecessarily
- No `LIMIT` - fetches all unread notifications at once (could be thousands)
- No index on `studentID`, `isRead`, or `createdAt` causing full table scan

#### Why is it slow?
- With 50,000 students and 5,000,000 notifications, a full table scan on every request is O(n)
- `ORDER BY createdAt DESC` without index requires sorting entire result set in memory

#### What to change:
```sql
SELECT id, type, message, created_at, is_read
FROM student_notifications sn
JOIN notifications n ON sn.notification_id = n.id
WHERE sn.student_id = 1042 AND sn.is_read = false
ORDER BY n.created_at DESC
LIMIT 20;
```

---

#### Should we add indexes on every column?
**No, this is bad advice.** Reasons:
- Every index slows down INSERT/UPDATE/DELETE operations
- Indexes consume significant disk space
- Most columns are never queried directly

#### Correct indexes to add:
```sql

CREATE INDEX idx_student_notifications_student_read
ON student_notifications(student_id, is_read);


CREATE INDEX idx_notifications_created_at
ON notifications(created_at DESC);


CREATE INDEX idx_notifications_type
ON notifications(type);
```

---

#### Query to find students who got placement notification in last 7 days:
```sql
SELECT DISTINCT s.id, s.name, s.email
FROM students s
JOIN student_notifications sn ON s.id = sn.student_id
JOIN notifications n ON sn.notification_id = n.id
WHERE n.notification_type = 'Placement'
AND n.created_at >= NOW() - INTERVAL '7 days';
```

---

## Stage 4

### Performance Optimization - Caching Strategy

#### Problem:
Notifications fetched on every page load for every student is overwhelming the DB.

---

### Solution 1: Redis Cache (Recommended)

**How it works:**
- Cache each student's notification list in Redis with key `notifications:studentID`
- TTL (time to live) of 60 seconds
- On new notification: invalidate that student's cache
- On page load: check Redis first, only hit DB on cache miss

**Tradeoffs:**
-  Reduces DB load by 90%+
-  Response time drops from ~500ms to ~5ms
-  Extra infrastructure (Redis server)
-  Cache invalidation complexity
-  Slight staleness (up to TTL seconds)

```javascript

const cached = await redis.get(`notifications:${studentID}`);
if (cached) return JSON.parse(cached);


const data = await db.query(...);
await redis.setex(`notifications:${studentID}`, 60, JSON.stringify(data));
return data;
```

---

### Solution 2: Pagination

**How it works:**
- Never load all notifications at once
- Load only 10-20 at a time
- Use infinite scroll or "Load more" button

**Tradeoffs:**
- Simple to implement
- Reduces data transfer significantly
- Students may miss older notifications
- Still hits DB on every page change

---

### Solution 3: CDN + Edge Caching

For global notifications (sent to all students), cache at CDN level.

**Tradeoffs:**
- Extremely fast globally
- Only works for non-personalized notifications

---

### Recommended Combined Approach:
1. **Redis** for per-student notification cache (60s TTL)
2. **Pagination** to limit data per request (20 items)
3. **WebSocket push** to invalidate cache in real time on new notification

---

## Stage 5

### Redesigning notify_all

#### Original pseudocode problems:
```
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)   # calls Email API
        save_to_db(student_id, message)   # DB insert
        push_to_app(student_id, message)  # real time push
```

**Shortcomings:**
1. **Sequential processing** - 50,000 students processed one by one, extremely slow
2. **No error handling** - if `send_email` fails at student 200, remaining 49,800 are skipped
3. **Synchronous DB inserts** - 50,000 individual DB inserts will overwhelm the DB
4. **No retry mechanism** - failed emails are lost forever
5. **Email and DB tightly coupled** - if DB insert fails, email already sent (inconsistency)
6. **Blocks the server** - entire server hangs during execution

#### Should saving to DB and sending email happen together?
**No.** They should be decoupled via a message queue. Save to DB first (source of truth), then send email asynchronously. This ensures even if email fails, the notification is not lost.

---

### Redesigned pseudocode:

```
function notify_all(student_ids: array, message: string):
    // Step 1: Bulk insert all notifications to DB at once
    bulk_insert_to_db(student_ids, message)
    
    // Step 2: Push all student_ids to a message queue (e.g. RabbitMQ / Redis Queue)
    for batch in chunks(student_ids, size=500):
        queue.push({ batch, message })

// Queue Worker (runs separately, multiple instances)
function process_queue_job(job):
    for student_id in job.batch:
        try:
            send_email(student_id, job.message)
            push_to_app(student_id, job.message)
            mark_as_sent(student_id, job.message)
        catch error:
            // Retry up to 3 times with exponential backoff
            if job.retries < 3:
                queue.push(job with retries+1, delay=2^retries seconds)
            else:
                log_failed(student_id, job.message)
```

**Improvements:**
- Bulk DB insert instead of 50,000 individual inserts
- Parallel processing via multiple queue workers
- Automatic retry with exponential backoff
- DB and email decoupled - DB is source of truth
- Server is not blocked
- Failed emails tracked and retried

---

## Stage 6

### Priority Inbox Implementation

**Approach:** Weighted scoring combining notification type weight and recency.

**Priority Score Formula:**
```
score = typeWeight + recencyScore

typeWeight:
  Placement = 3
  Result    = 2
  Event     = 1

recencyScore = 1 / (1 + hoursAgo)
```

This ensures Placement notifications always rank higher than Results which rank higher than Events, but a very recent Event can outrank an older Placement of similar age.

New notifications are inserted into a **Max Heap** data structure so the top N can always be retrieved in O(log n) time.

See `notification_app_be/priorityInbox.js` for full implementation.
