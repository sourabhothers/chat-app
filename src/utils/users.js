const { getuid } = require("process");

const users = [];

const addUser = ({ id, username, room }) => {
  // clean data

  if (!username || !room) {
    return {
      error: "Username and Room required",
    };
  }
  
  username = username.toString().trim().toLowerCase();
  room = room.toString().trim().toLowerCase();

  // check if user is in a room
  const existingUser = users.find((user) => {
    return user.username === username && user.room === room;
  });

  if (existingUser) {
    return {
      error: "User already exists in room",
    };
  }

  // else add user to room
  const user = { id, username, room };
  users.push(user);
  return { user };
};

// remove user by ID
const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) {
    return users.splice(index, 1)[0];
  }
};

// Get user by ID
const getUser = (id) => {
  if (!id) {
    return { error: "ID parameter needs to be pass!" };
  }
  const user = users.find((user) => user.id === id);
  if (!user) {
    return { error: "User not available with provided ID." };
  }
  return { user };
};

// Get users in a room
const getUsersInRoom = (room) => {
  room = room.toString().trim().toLowerCase();
  const usersArray = users.filter((user) => user.room === room);
  if (usersArray.length === 0) {
    return { error: "Users not available in a room OR Room not availale" };
  }
  return usersArray;
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
};
