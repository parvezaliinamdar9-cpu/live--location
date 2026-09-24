const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const rooms = new Map();

io.on("connection", (socket) => {
  socket.on("join-room", ({ room, role }) => {
    if (!room) return;

    socket.join(room);
    socket.data.room = room;
    socket.data.role = role;

    if (!rooms.has(room)) {
      rooms.set(room, { location: null });
    }

    const saved = rooms.get(room);

    if (role === "viewer" && saved.location) {
      socket.emit("location-update", saved.location);
    }
  });

  socket.on("location-update", (data) => {
    const room = socket.data.room;
    if (!room) return;

    if (!rooms.has(room)) {
      rooms.set(room, { location: null });
    }

    rooms.get(room).location = data;

    socket.to(room).emit("location-update", data);
  });

  socket.on("stop-sharing", () => {
    const room = socket.data.room;
    if (room) {
      socket.to(room).emit("stop-sharing");
    }
  });

  socket.on("disconnect", () => {
    socket.leave(socket.data.room);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
