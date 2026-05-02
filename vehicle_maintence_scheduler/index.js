const express = require("express");
const axios = require("axios");
const { Log } = require("../logging_middleware/index");
const app = express();
app.use(express.json());
const BASE_URL = "http://20.207.122.201/evaluation-service";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJsczExNThAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwNDA3MywiaWF0IjoxNzc3NzAzMTczLCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiYTUyN2UxNDMtYTdhNy00OWY4LTgyMGMtODU4OTRjZTNiZDQ3IiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibGFrc2h5YSBzYWJoYXJ3YWwiLCJzdWIiOiJmNjVkMzYyZS1hYTZkLTRjNGYtYWU2MS04NGIyZDE3OTBmNTgifSwiZW1haWwiOiJsczExNThAc3JtaXN0LmVkdS5pbiIsIm5hbWUiOiJsYWtzaHlhIHNhYmhhcndhbCIsInJvbGxObyI6InJhMjMxMTAwMzAxMTc0OCIsImFjY2Vzc0NvZGUiOiJRa2JweEgiLCJjbGllbnRJRCI6ImY2NWQzNjJlLWFhNmQtNGM0Zi1hZTYxLTg0YjJkMTc5MGY1OCIsImNsaWVudFNlY3JldCI6IlFuWkttalphckZxWVFkUXkifQ.k0QmaJx5eQ8T9DWoKlZ_FyfN-Po5AGSy8rwMbfdLr_o";
const headers = {
Authorization: `Bearer ${TOKEN}`,
"Content-Type": "application/json",
};
function knapsack(vehicles, capacity) {
  const n = vehicles.length;
  const dp = Array(capacity + 1).fill(0);
  const selected = Array.from({ length: n + 1 }, () =>
    Array(capacity + 1).fill(false)
  );
  for (let i = 0; i < n; i++) {
    const duration = vehicles[i].Duration;
    const impact = vehicles[i].Impact;
    for (let w = capacity; w >= duration; w--) {
      if (dp[w - duration] + impact > dp[w]) {
        dp[w] = dp[w - duration] + impact;
        selected[i + 1][w] = true;
      }
    }
  }
  const result = [];
  let remaining = capacity;
  for (let i = n; i > 0; i--) {
    if (selected[i][remaining]) {
      result.push(vehicles[i - 1]);
      remaining -= vehicles[i - 1].Duration;
    }
  }
  return result;
}
app.get("/schedule", async (req, res) => {
  await Log("backend", "info", "handler", "GET /schedule - request received");
  try {
    await Log("backend", "info", "service", "Fetching depots from test server");
    const depotsRes = await axios.get(`${BASE_URL}/depots`, { headers });
    const depots = depotsRes.data.depots;
    await Log("backend", "info", "service", `Fetched ${depots.length} depots`);
    await Log("backend", "info", "service", "Fetching vehicles from test server");
    const vehiclesRes = await axios.get(`${BASE_URL}/vehicles`, { headers });
    const vehicles = vehiclesRes.data.vehicles;
    await Log("backend", "info", "service", `Fetched ${vehicles.length} vehicles`);
    const schedules = [];
    for (const depot of depots) {
      await Log("backend", "debug", "service", `Running knapsack for depot ${depot.ID} with ${depot.MechanicHours} hours`);
      const selected = knapsack(vehicles, depot.MechanicHours);
      const totalDuration = selected.reduce((sum, v) => sum + v.Duration, 0);
      const totalImpact = selected.reduce((sum, v) => sum + v.Impact, 0);
      schedules.push({
        depotID: depot.ID,
        mechanicHours: depot.MechanicHours,
        selectedTasks: selected,
        totalDuration,
        totalImpact,
      });
    }
    await Log("backend", "info", "handler", `GET /schedule - returning ${schedules.length} depot schedules`);
    res.json({ success: true, data: schedules });
  } catch (err) {
    await Log("backend", "error", "handler", `GET /schedule - error: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "vehicle-maintenance-scheduler" });
});
const PORT = 3001;
app.listen(PORT, async () => {
  await Log("backend", "info", "service", `Vehicle Maintenance Scheduler running on port ${PORT}`);
  console.log(`Server running on port ${PORT}`);
});