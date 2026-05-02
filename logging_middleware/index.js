const axios = require("axios");

const LOG_URL = "http://20.207.122.201/evaluation-service/logs";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJsczExNThAc3JtaXN0LmVkdS5pbiIsImV4cCI6MTc3NzcwNjM0NSwiaWF0IjoxNzc3NzA1NDQ1LCJpc3MiOiJBZmZvcmQgTWVkaWNhbCBUZWNobm9sb2dpZXMgUHJpdmF0ZSBMaW1pdGVkIiwianRpIjoiY2RkOWMyY2EtYWUwNS00Njk5LTlkYjQtNTdjYTVmN2I2NmQyIiwibG9jYWxlIjoiZW4tSU4iLCJuYW1lIjoibGFrc2h5YSBzYWJoYXJ3YWwiLCJzdWIiOiJmNjVkMzYyZS1hYTZkLTRjNGYtYWU2MS04NGIyZDE3OTBmNTgifSwiZW1haWwiOiJsczExNThAc3JtaXN0LmVkdS5pbiIsIm5hbWUiOiJsYWtzaHlhIHNhYmhhcndhbCIsInJvbGxObyI6InJhMjMxMTAwMzAxMTc0OCIsImFjY2Vzc0NvZGUiOiJRa2JweEgiLCJjbGllbnRJRCI6ImY2NWQzNjJlLWFhNmQtNGM0Zi1hZTYxLTg0YjJkMTc5MGY1OCIsImNsaWVudFNlY3JldCI6IlFuWkttalphckZxWVFkUXkifQ.NqWKks90jWq0I372PVAO05EKKZ21hHD5wrZCyNUb7vA"

async function Log(stack, level, pkg, message) {
  try {
    const response = await axios.post(
      LOG_URL,
      {
        stack: stack,
        level: level,
        package: pkg,
        message: message,
      },
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("[Logger] Log sent:", response.data.logID);
  } catch (err) {
    console.error("[Logger] Failed to send log:", err.message);
  }
}

module.exports = { Log };