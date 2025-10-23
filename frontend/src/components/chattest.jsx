import React, { useState, useEffect, useRef } from "react";

function Chat() {
  const [username, setUsername] = useState("");
  const [target, setTarget] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:5500");

    ws.current.onopen = () => {
      console.log("Connected to server ✅");
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        alert(data.error);
      } else {
        setMessages((prev) => [...prev, data]);
      }
    };

    return () => ws.current.close();
  }, []);

  const register = () => {
    ws.current.send(JSON.stringify({ type: "register", username }));
  };

  const sendMessage = () => {
    ws.current.send(
      JSON.stringify({
        type: "private_message",
        username,
        target,
        message,
      })
    );
    setMessages((prev) => [...prev, { from: "me", message }]);
    setMessage("");
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Private Chat</h2>

      {!username && (
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <button onClick={register}>Join</button>
        </div>
      )}

      {username && (
        <>
          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="Send to (target username)"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>

          <div
            style={{
              border: "1px solid #ccc",
              borderRadius: 8,
              padding: 10,
              height: 250,
              overflowY: "auto",
              marginBottom: 10,
            }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{ margin: "5px 0" }}>
                <strong>{m.from === "me" ? "You" : m.from}:</strong> {m.message}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, padding: 8 }}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}

export default Chat;
