const express =require("express");
const  ws =require("ws");
const WebSocketServer=ws.WebSocketServer;
const http =require("http");
const app=require("./server")

// const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server });

const users = new Map(); // username -> ws

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (data) => {
    try {
      const parsed = JSON.parse(data);
      const { type, username, target, message } = parsed;

      if (type === "register") {
        // Store user connection
        users.set(username, ws);
        console.log(`User registered: ${username}`);
        return;
      }

      if (type === "private_message") {
        const targetSocket = users.get(target);
        if (targetSocket && targetSocket.readyState === ws.OPEN) {
          targetSocket.send(
            JSON.stringify({
              from: username,
              message,
              time: new Date().toLocaleTimeString(),
            })
          );
        } else {
          ws.send(JSON.stringify({ error: "User not online" }));
        }
      }
    } catch (err) {
      console.error("Invalid message:", err);
    }
  });

  ws.on("close", () => {
    // Remove disconnected users
    for (let [user, socket] of users.entries()) {
      if (socket === ws) users.delete(user);
    }
    console.log("Client disconnected");
  });
});


const PORT = 5500;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
