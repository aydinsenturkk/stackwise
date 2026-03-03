# Socket.IO

## Server Setup

```typescript
import { Server } from "socket.io";
import { createServer } from "http";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  pingInterval: 25000,
  pingTimeout: 20000,
  maxHttpBufferSize: 1e6, // 1MB
});

httpServer.listen(3000);
```

### With Express

```typescript
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

httpServer.listen(3000);
```

---

## TypeScript Interfaces

```typescript
interface ServerToClientEvents {
  noArg: () => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
}

interface ClientToServerEvents {
  hello: (msg: string) => void;
  joinRoom: (room: string) => void;
}

interface InterServerEvents {
  ping: () => void;
}

interface SocketData {
  name: string;
  age: number;
}

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer);
```

---

## Namespaces

```typescript
// Default namespace
io.on("connection", (socket) => {
  console.log("connected to /");
});

// Custom namespace
const adminNsp = io.of("/admin");
adminNsp.on("connection", (socket) => {
  console.log("connected to /admin");
});

// Dynamic namespace
const dynamicNsp = io.of(/^\/team-\d+$/);
dynamicNsp.on("connection", (socket) => {
  const namespace = socket.nsp;
  console.log(`connected to ${namespace.name}`);
});
```

---

## Rooms

```typescript
io.on("connection", (socket) => {
  // Join a room
  socket.join("room-123");

  // Join multiple rooms
  socket.join(["room-a", "room-b"]);

  // Leave a room
  socket.leave("room-123");

  // Emit to a specific room (excluding sender)
  socket.to("room-123").emit("basicEmit", 1, "hello", Buffer.from([1]));

  // Emit to multiple rooms
  socket.to("room-a").to("room-b").emit("noArg");

  // Emit to a room (including sender)
  io.in("room-123").emit("noArg");

  // Get all sockets in a room
  const sockets = await io.in("room-123").fetchSockets();
});
```

---

## Events and Broadcasting

```typescript
io.on("connection", (socket) => {
  // Listen for events
  socket.on("hello", (msg) => {
    console.log(msg);
  });

  // Emit to the connected client
  socket.emit("basicEmit", 1, "hello", Buffer.from([1]));

  // Broadcast to all clients except sender
  socket.broadcast.emit("noArg");

  // Emit to all connected clients
  io.emit("noArg");

  // Emit to all clients in a namespace
  io.of("/admin").emit("noArg");

  // Emit with acknowledgement
  socket.emit("withAck", "data", (response) => {
    console.log(response); // number
  });

  // Acknowledgement with timeout
  socket.timeout(5000).emit("withAck", "data", (err, response) => {
    if (err) {
      console.log("timeout");
    } else {
      console.log(response);
    }
  });
});
```

### Volatile Events (fire and forget)

```typescript
socket.volatile.emit("noArg");
```

---

## Middleware

```typescript
// Namespace middleware (runs on connection)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    const err = new Error("authentication required");
    (err as any).data = { content: "Please provide a token" };
    return next(err);
  }

  try {
    const user = verifyToken(token);
    socket.data.name = user.name;
    next();
  } catch {
    next(new Error("invalid token"));
  }
});

// Per-namespace middleware
const adminNsp = io.of("/admin");
adminNsp.use((socket, next) => {
  if (!socket.data.isAdmin) {
    return next(new Error("not an admin"));
  }
  next();
});
```

### Client-Side Error Handling

```typescript
socket.on("connect_error", (err) => {
  console.log(err instanceof Error); // true
  console.log(err.message);          // "not authorized"
  console.log((err as any).data);    // { content: "Please retry later" }
});
```

---

## Error Handling

```typescript
io.on("connection", (socket) => {
  socket.on("error", (err) => {
    console.error("socket error:", err);
  });

  // Catch-all listener for debugging
  socket.onAny((event, ...args) => {
    console.log(`received ${event}`, args);
  });

  // Catch-all for outgoing events
  socket.onAnyOutgoing((event, ...args) => {
    console.log(`sending ${event}`, args);
  });

  socket.on("disconnect", (reason) => {
    console.log(`disconnected: ${reason}`);
    // reasons: "io server disconnect", "io client disconnect",
    // "ping timeout", "transport close", "transport error"
  });
});
```

---

## Binary Data

```typescript
io.on("connection", (socket) => {
  // Send binary data
  socket.emit("basicEmit", 1, "file", Buffer.from([0x01, 0x02]));

  // Receive binary data
  socket.on("upload", (buffer: Buffer) => {
    // process buffer
  });
});
```

---

## Reconnection (Client-Side)

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  auth: {
    token: "abc123",
  },
});

socket.on("connect", () => {
  console.log("connected:", socket.id);
});

socket.on("disconnect", (reason) => {
  if (reason === "io server disconnect") {
    // server disconnected, need to manually reconnect
    socket.connect();
  }
  // else automatic reconnection
});
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Storing socket references in arrays | Memory leaks when clients disconnect | Use rooms and `io.in(room).fetchSockets()` |
| No authentication middleware | Anyone can connect and emit events | Add `io.use()` middleware to verify tokens |
| Emitting user input without validation | Injection and malformed data | Validate all incoming event payloads |
| Using `io.emit` for targeted messages | Broadcasts to every client unnecessarily | Use rooms or `socket.to(id).emit()` |
| No error handler on socket | Unhandled errors crash the process | Always listen for `"error"` events |
| Large payloads without `maxHttpBufferSize` | Memory exhaustion from oversized messages | Set `maxHttpBufferSize` on server options |
| Not handling `disconnect` events | Stale state and resource leaks | Clean up resources in `disconnect` handler |
| Creating new namespace per user | Excessive memory and overhead | Use rooms within a single namespace |
