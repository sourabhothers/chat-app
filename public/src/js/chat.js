const socket = io();

// Elements
const chatForm = document.getElementById("chat-form"),
  messagesView = document.getElementById("messages"),
  sidebarView = document.getElementById("sidebar");
let msgInpt = document.getElementById("msg"),
  msgBtn = document.getElementById("send-location");

// query string
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// emit username and room to join
socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    return (location.href = "/");
  }
  console.log(`Connected to room successfully`);
});

// Templates
const messageTemplate = document.getElementById("message-template").innerHTML,
  linkTemplate = document.getElementById("location-message-template").innerHTML,
  sidebarTemplate = document.getElementById("sidebar-template").innerHTML;


// auto scrolling to new message feature
const autoScroll = () => {
    // New message element
    const newMessage = messagesView.lastElementChild;
    // height of new message
    const newMessageStyle = getComputedStyle(newMessage),
      newMessageMargin = parseInt(newMessageStyle.marginBottom),
      newMessageHeight = newMessage.offsetHeight + newMessageMargin;
    // visible height of messages view
    const visibleHeight = messagesView.offsetHeight;
    // maximum scrollable height of messages view
    const containerHeight = messagesView.scrollHeight;
    // how far i scrolled
    const scrollOffset = messagesView.scrollTop + visibleHeight;
  
    if (containerHeight - newMessageHeight <= scrollOffset) {
      messagesView.scrollTop = messagesView.scrollHeight;
    }
  };

socket.on("msg", (msg) => {
  const html = Mustache.render(messageTemplate, {
    username: msg.username,
    message: msg.text,
    createdAt: moment(msg.createdAt).format("hh:mm:ss a"),
  });
  messagesView.insertAdjacentHTML("beforeend", html);
  autoScroll()
});

// receive location
socket.on("sendLocation", (location) => {
  const link = `https://google.com/maps?q=${location.text.lat},${location.text.long}`;
  const html = Mustache.render(linkTemplate, {
    username: location.username,
    link,
    createdAt: moment(location.createdAt).format("hh:mm:ss a"),
  });
  messagesView.insertAdjacentHTML("beforeend", html);
  autoScroll()
});

// send message
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  let msg = msgInpt.value;
  if (msg.includes("refresh")) {
    socket.emit("refresh", "refreshAll");
  }
  msgBtn.setAttribute("disabled", "disabled");
  socket.emit("send", msg, (err, success) => {
    msgInpt.value = "";
    msgBtn.removeAttribute("disabled");
    msgInpt.focus();
    if (err) {
      return console.log(err);
    }
  });
});

// send location
const sendLocationBtn = document.getElementById("send-location");
sendLocationBtn.addEventListener("click", () => {
  console.log("sendLocation Button Clicked");
  sendLocationBtn.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    alert("Your browser doesn't support location");
  }
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        lat: position.coords.latitude,
        long: position.coords.longitude,
        accuracy: position.coords.accuracy,
      },
      (err) => {
        sendLocationBtn.removeAttribute("disabled");
      }
    );
  });
});

// update usrs list when Connects or Disconnects from room
socket.on("roomData", (data) => {
  if (!data) {
    return console.log("roomData not received");
  }
  const html = Mustache.render(sidebarTemplate, {
    ...data,
  });
  //   console.log({...data})
  sidebarView.innerHTML = html;
});

// refresh all open windows
socket.on("refresh", () => {
  location.reload();
});
