# ws (WebSocket)

## Server Creation

```typescript
import { WebSocketServer, WebSocket } from "ws";

// Standalone server
const wss = new WebSocketServer({ port: 8080 });

// With existing HTTP server
import { createServer } from "http";

const server = createServer();
const wss = new WebSocketServer({ server });
server.listen(8080);
```

### Server Options

```typescript
const wss = new WebSocketServer({
  port: 8080,
  perMessageDeflate: false,       // Disable compression (better perf)
  maxPayload: 50 * 1024 * 1024,   // 50MB max message size
  clientTracking: true,            // Track connected clients via wss.clients
  backlog: 100,                    // Max pending connections
});
```

---

## Connection Handling

```typescript
wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
  console.log("Client connected from:", request.socket.remoteAddress);

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });

  ws.on("message", (data: Buffer, isBinary: boolean) => {
    const message = isBinary ? data : data.toString();
    console.log("received:", message);
  });

  ws.on("close", (code: number, reason: Buffer) => {
    console.log(`Disconnected: ${code} - ${reason.toString()}`);
  });

  ws.send("welcome");
});
```

---

## Message Parsing

```typescript
// JSON protocol pattern
interface WsMessage {
  type: string;
  payload: unknown;
}

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (data: Buffer) => {
    try {
      const message: WsMessage = JSON.parse(data.toString());

      switch (message.type) {
        case "chat":
          handleChat(ws, message.payload);
          break;
        case "ping":
          ws.send(JSON.stringify({ type: "pong" }));
          break;
        default:
          ws.send(JSON.stringify({ type: "error", payload: "unknown type" }));
      }
    } catch {
      ws.send(JSON.stringify({ type: "error", payload: "invalid JSON" }));
    }
  });
});

function send(ws: WebSocket, type: string, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, payload }));
  }
}
```

---

## Binary Data

```typescript
import WebSocket from "ws";

// Sending binary
const ws = new WebSocket("ws://localhost:8080");

ws.on("open", () => {
  // Send Buffer
  ws.send(Buffer.from([0x01, 0x02, 0x03]));

  // Send Float32Array
  const array = new Float32Array([1.5, 2.5, 3.5]);
  ws.send(array);

  // Send with options
  ws.send(Buffer.from("data"), {
    binary: true,
    compress: true,
    fin: true,
  }, (err) => {
    if (err) console.error("Send failed:", err);
  });
});

// Receiving binary
ws.on("message", (data: Buffer, isBinary: boolean) => {
  if (isBinary) {
    // Handle raw binary data
    console.log("Binary bytes:", data.length);
  } else {
    console.log("Text:", data.toString());
  }
});
```

---

## Ping/Pong (Heartbeat)

```typescript
const wss = new WebSocketServer({ port: 8080 });
const HEARTBEAT_INTERVAL = 30000;

wss.on("connection", (ws) => {
  (ws as any).isAlive = true;

  ws.on("error", console.error);

  ws.on("pong", () => {
    (ws as any).isAlive = true;
  });
});

// Interval to detect broken connections
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if ((ws as any).isAlive === false) {
      return ws.terminate();
    }
    (ws as any).isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

wss.on("close", () => {
  clearInterval(interval);
});
```

---

## Authentication

```typescript
import { createServer, IncomingMessage } from "http";
import { WebSocketServer } from "ws";

const server = createServer();
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (ws, request, client) => {
  ws.on("error", console.error);

  ws.on("message", (data) => {
    console.log(`Message from ${(client as any).userId}: ${data}`);
  });
});

server.on("upgrade", (request: IncomingMessage, socket, head) => {
  socket.on("error", console.error);

  authenticate(request, (err, client) => {
    if (err || !client) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    socket.removeListener("error", console.error);

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request, client);
    });
  });
});

function authenticate(
  request: IncomingMessage,
  callback: (err: Error | null, client: unknown) => void,
) {
  const url = new URL(request.url!, `http://${request.headers.host}`);
  const token = url.searchParams.get("token");
  // or: request.headers["authorization"]

  if (!token) {
    return callback(new Error("No token"), null);
  }

  try {
    const user = verifyToken(token);
    callback(null, user);
  } catch (err) {
    callback(err as Error, null);
  }
}

server.listen(8080);
```

---

## Error Handling

```typescript
wss.on("connection", (ws) => {
  // Always attach error handler first
  ws.on("error", (err) => {
    console.error("WebSocket error:", err.message);
  });

  ws.on("close", (code, reason) => {
    // 1000 = normal, 1001 = going away, 1006 = abnormal
    if (code !== 1000 && code !== 1001) {
      console.error(`Abnormal close: ${code} ${reason.toString()}`);
    }
  });
});

// Server-level error
wss.on("error", (err) => {
  console.error("WebSocket server error:", err);
});
```

---

## Broadcasting

```typescript
// Broadcast to all connected clients
function broadcast(wss: WebSocketServer, data: string) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Broadcast to all except sender
function broadcastExcept(
  wss: WebSocketServer,
  sender: WebSocket,
  data: string,
) {
  wss.clients.forEach((client) => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}
```

---

## Scaling with Clusters

```typescript
import cluster from "cluster";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import os from "os";

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    ws.on("error", console.error);
    ws.on("message", (data) => {
      // Use pub/sub (e.g., Redis) to broadcast across workers
      publishToRedis("ws:messages", data.toString());
    });
  });

  // Subscribe to cross-worker messages
  subscribeToRedis("ws:messages", (message) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  server.listen(8080);
}
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| No `error` handler on socket | Unhandled errors crash the process | Always attach `ws.on("error", ...)` first |
| No heartbeat (ping/pong) | Dead connections stay open forever | Implement ping/pong interval with `terminate()` |
| Parsing messages without try/catch | Invalid JSON crashes the handler | Wrap `JSON.parse` in try/catch |
| Not checking `readyState` before send | Errors when sending to closed sockets | Check `ws.readyState === WebSocket.OPEN` |
| Storing state in global arrays | Memory leaks and no cross-worker sync | Use external store (Redis) for shared state |
| No authentication on upgrade | Anyone can open a WebSocket connection | Use `noServer` mode with `handleUpgrade` |
| No `maxPayload` limit | Memory exhaustion from large messages | Set `maxPayload` in server options |
| Broadcasting in clusters without pub/sub | Messages only reach same-worker clients | Use Redis pub/sub for cross-worker broadcast |
