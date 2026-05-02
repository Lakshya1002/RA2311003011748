const axios = require("axios");
const { Log } = require("../logging_middleware/index");
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJsczExNThAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwNjM0NSwiaWF0IjoxNzc3NzA1NDQ1LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiY2RkOWMyY2EtYWUwNS00Njk5LTlkYjQtNTdjYTVmN2I2NmQyIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibGFrc2h5YSBzYWJoYXJ3YWwiLCJzdWIiOiJmNjVkMzYyZS1hYTZkLTRjNGYtYWU2MS04NGIyZDE3OTBmNTgifSwiZW1haWwiOiJsczExNThAc3JtaXN0LmVkdS5pbiIsIm5hbWUiOiJsYWtzaHlhIHNhYmhhcndhbCIsInJvbGxObyI6InJhMjMxMTAwMzAxMTc0OCIsImFjY2Vzc0NvZGUiOiJRa2JweEgiLCJjbGllbnRJRCI6ImY2NWQzNjJlLWFhNmQtNGM0Zi1hZTYxLTg0YjJkMTc5MGY1OCIsImNsaWVudFNlY3JldCI6IlFuWkttalphckZxWVFkUXkifQ.NqWKks90jWq0I372PVAO05EKKZ21hHD5wrZCyNUb7vA"
const NOTIFICATIONS_URL = "http://20.207.122.201/evaluation-service/notifications";
const TYPE_WEIGHT = {
  Placement: 3,
  Result: 2,
  Event: 1,
};
function calculateScore(notification) {
  const typeWeight = TYPE_WEIGHT[notification.Type] || 1;
  const timestamp = new Date(notification.Timestamp).getTime();
  const now = Date.now();
  const hoursAgo = (now - timestamp) / (1000 * 60 * 60);
  const recencyScore = 1 / (1 + hoursAgo);
  return typeWeight + recencyScore;
}
class MaxHeap {
  constructor() {
    this.heap = [];
  }
  insert(notification) {
    notification._score = calculateScore(notification);
    this.heap.push(notification);
    this._bubbleUp(this.heap.length - 1);
  }
  extractMax() {
    if (this.heap.length === 0) return null;
    const max = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return max;
  }
  _bubbleUp(index) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent]._score >= this.heap[index]._score) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }
  _sinkDown(index) {
    const length = this.heap.length;
    while (true) {
      let largest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      if (left < length && this.heap[left]._score > this.heap[largest]._score) {
        largest = left;
      }
      if (right < length && this.heap[right]._score > this.heap[largest]._score) {
        largest = right;
      }
      if (largest === index) break;
      [this.heap[largest], this.heap[index]] = [this.heap[index], this.heap[largest]];
      index = largest;
    }
  }
  size() {
    return this.heap.length;
  }
}
function getTopN(notifications, n) {
  const heap = new MaxHeap();
  for (const notification of notifications) {
    heap.insert(notification);
  }
  const result = [];
  for (let i = 0; i < n && heap.size() > 0; i++) {
    result.push(heap.extractMax());
  }
  return result;
}
async function getPriorityInbox(topN = 10) {
  await Log("backend", "info", "service", `Fetching priority inbox - top ${topN} notifications`);
  try {
    await Log("backend", "info", "service", "Fetching notifications from evaluation server");
    const response = await axios.get(NOTIFICATIONS_URL, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    const notifications = response.data.notifications;
    await Log("backend", "info", "service", `Fetched ${notifications.length} notifications`);
    const topNotifications = getTopN(notifications, topN);
    await Log("backend", "info", "service", `Computed top ${topN} priority notifications`);
    console.log(`\n===== TOP ${topN} PRIORITY NOTIFICATIONS =====\n`);
    topNotifications.forEach((n, index) => {
      console.log(`${index + 1}. [${n.Type}] ${n.Message}`);
      console.log(`   ID: ${n.ID}`);
      console.log(`   Timestamp: ${n.Timestamp}`);
      console.log(`   Priority Score: ${n._score.toFixed(4)}`);
      console.log("");
    });
    return topNotifications;
  } catch (err) {
    await Log("backend", "error", "service", `Failed to fetch priority inbox: ${err.message}`);
    console.error("Error:", err.message);
  }
}
getPriorityInbox(10);
