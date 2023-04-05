const path = require("path");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 2000;
const socketio = require("socket.io");
const http = require("http");
const xss = require("xss");

// Set static folder
app.use(express.static(path.join(__dirname, "../public")));

const server = http.createServer(app);
const io = socketio(server);

let users = [];

// Handles client connections
io.on("connection", (socket) => {
  console.log("Client connected");

  socket.emit("message", "Welcome to WMAD Chat");

  //hanle user joined
  socket.on("userJoin", (message) => {
    const { user } = JSON.parse(message); // deserialization
    newUser(user, socket, io);
  });

  socket.on("canvasDraw", canvasData => {
    console.log("Canvas Drew")
    const data = JSON.parse(xss(canvasData));

    // console.log("value " + xss(data.msg));
    io.sockets.emit('broadcastCanvasValue', JSON.stringify({
      chatMessage: { user: data.user, msg: xss(data.msg) }
    }))
  })

  socket.on('disconnect', () => {
    users = users.filter(u => u.id !== socket.id)

    io.sockets.emit('userDisconnect', JSON.stringify({
      id: socket.id
    }))
  })
});

const newUser = (user, socket, io) => {
  users.push({ user, id: socket.id });
  socket.emit("userJoined", "You are now joined");

  io.sockets.emit("userList", JSON.stringify({ user, users }));
};

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// <script>window.close() </script>
