const express = require("express"),
  app = express(),
  path = require("path"),
  http = require("http"),
  socketio = require("socket.io"),
  Filter = require("bad-words");

const { generateMessage } = require("./utils/messages"),
  { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users");

const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname, "../public")));

io.on("connection", (socket) => {
  // New user to Join Room
  socket.on("join", (options, cb) => {
    const { error, user } = addUser({ id: socket.id, ...options });

    if (error) {
      return cb(error);
    }

    socket.join(user.room);

    socket.emit(
      "welcome",
      generateMessage(`Welcome ${user.username} to ${user.room} room!`, "Bot!")
    ); // socket.emit for only single connected

    socket.broadcast
      .to(user.room)
      .emit(
        "msg",
        generateMessage(`${user.username} has joined room!`, "Bot!")
      ); // socket.broadcast.emit will send message to all connections except called one

    io.to(user.room).emit("roomData", {
      //Sending alll users when new one connects
      room: user.room,
      users: getUsersInRoom(user.room),
    });
  });

  socket.on("send", (msg, cb) => {
    const { user, error } = getUser(socket.id);

    if (error) {
      return console.log(error);
    }

    const filter = new Filter();
    if (filter.isProfane(msg)) {
      return cb("Profanity not allowed");
    }
    if (!msg.length) {
      return cb("Type some text!");
    }
    console.log(`sending ... ${msg} to ${user.room} from ${user.username}`);
    io.to(user.room).emit("msg", generateMessage(msg, user.username)); // io.emit for all connections
    cb(null, "done");
  });

  // refresh all connected browsers
  socket.on("refresh", () => {
    const { user, error } = getUser(socket.id);

    if (error) {
      return console.log(error);
    }

    io.to(user.room).emit("refresh", "refreshAll");
  });

  socket.on("sendLocation", (location, cb) => {
    const { user, error } = getUser(socket.id);

    if (error) {
      return console.log(user.error);
    }

    socket.broadcast
      .to(user.room)
      .emit("sendLocation", generateMessage(location, user.username));
    cb();
  });

  socket.on("disconnect", () => {
    const removedUser = removeUser(socket.id);

    if (removedUser) {
      socket.broadcast
        .to(removedUser.room)
        .emit(
          "msg",
          generateMessage(
            `${removedUser.username} has been disconnected`,
            "Bot!"
          )
        );

      return io.to(removedUser.room).emit("roomData", {
        //Sending all users when one disconnects
        room: removedUser.room,
        users: getUsersInRoom(removedUser.room),
      });
    }
  });
});

// emit(send) -> on(receive)

module.exports = { app, server };
