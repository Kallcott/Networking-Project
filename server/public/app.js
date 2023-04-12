console.log("Ready");

//#region DOM
const q = (selector) => {
  return document.querySelector(selector);
};

const frm = q("#frm");
const userDiv = q("#user");
const usersList = q("#userList");
const chatDiv = q("#chat");
const txtUser = q("#txtUser");
const btnLeave = q("#btnLeave");
const btnSend = q("#btnSend");
const txtChat = q("#txtChat");
const chatcontainer = q("#chatcontainer");
const drawCanvas = q("#DrawCanvas");
const uiCanvas = q("UiCanvas");

//#endregion
let socket = {};
let userList = [];

frm.addEventListener("submit", (e) => {
  e.preventDefault();

  socket = io(); // cpnnect to socket

  socket.emit("userJoin", JSON.stringify({ user: txtUser.value }));

  socket.on("userJoined", (userJoined) => {
    console.log("User Joined");
    userDiv.classList.toggle("hide");
    chatDiv.classList.toggle("hide");
    drawCanvas.removeAttribute('disabled');
    uiCanvas.removeAttribute('disabled');
  });

  socket.on("userList", (usersList) => {
    const data = JSON.parse(usersList);
    userJoin(data.user);
    loadUsers(data.users);
  });

  socket.on("userDisconnect", (disconnectedUser) => {
    const user = JSON.parse(disconnectedUser);
    const leavingUser = userList.find((u) => u.id == user.id);

    userList = userList.filter((u) => u.id !== user.id);

    loadUsers(userList);
    userLeft(leavingUser.user);
  });

  const DrawCanvas = document.getElementById("DrawCanvas");

  socket.on("broadcastCanvasValue", (msg) => {
    // console.log("return msg" + msg);
    const data = JSON.parse(msg);
    // console.log("Data: " + data.chatMessage.msg);
    const img = new Image();
    img.onload = function () {
      console.log("canvas type: " + img);
      DrawCanvas.getContext("2d").drawImage(img, 0, 0);
    };
    img.src = data.chatMessage.msg;
  });

  const UICanvas = document.getElementById("UiCanvas");
  const DrawCtx = DrawCanvas.getContext("2d");
  const UiCtx = UICanvas.getContext("2d");

  // Storage for Canvas Content
  let dataImg = new Image();

  // Get Color
  const colorPicker = document.getElementById("colorPicker");

  let drawColor = colorPicker.nodeValue;

  colorPicker.addEventListener("input", (event) => {
    drawColor = colorPicker.value;
  });

  // Draw

  // disable context menu on left click
  UICanvas.oncontextmenu = function () {
    return false;
  };

  let userColor = "pink";

  const baseLength = 40;

  // Curser position
  let x = 200;
  let y = 200;

  // Curser animation
  const minLength = 0;
  const maxLength = 2;
  let p = 0;

  let change = 0.02;
  let fps = 30;

  // Grid
  // Box width
  var bw = DrawCanvas.width;
  // Box height
  var bh = DrawCanvas.height;
  // Padding
  const pad = 0;

  drawBoard();
  animate()

  function animate() {
    p += change;
    if (p > 1 || p < 0) {
      change *= -1;
    }
    const growth = minLength + maxLength * p;
    UiCtx.clearRect(0, 0, UICanvas.width, UICanvas.height);

    UiCtx.beginPath();
    //   console.log("animate X " + x + " Y " + y);
    //#region crosshair
    //Top Left
    UiCtx.moveTo(x + baseLength * 0.25 + growth, y + baseLength * 0.0 + growth);
    UiCtx.lineTo(x + baseLength * 0.0 + growth, y + baseLength * 0.0 + growth);
    UiCtx.lineTo(x + baseLength * 0.0 + growth, y + baseLength * 0.25 + growth);

    //Top Right
    UiCtx.moveTo(x + baseLength * 0.75 + growth, y + baseLength * 0.0 + growth);
    UiCtx.lineTo(x + baseLength * 1.0 + growth, y + baseLength * 0.0 + growth);
    UiCtx.lineTo(x + baseLength * 1.0 + growth, y + baseLength * 0.25 + growth);

    //Bot Left
    UiCtx.moveTo(x + baseLength * 0.0 + growth, y + baseLength * 0.75 + growth);
    UiCtx.lineTo(x + baseLength * 0.0 + growth, y + baseLength * 1.0 + growth);
    UiCtx.lineTo(x + baseLength * 0.25 + growth, y + baseLength * 1.0 + growth);

    // Bot Right
    UiCtx.moveTo(x + baseLength * 1.0 + growth, y + baseLength * 0.75 + growth);
    UiCtx.lineTo(x + baseLength * 1.0 + growth, y + baseLength * 1.0 + growth);
    UiCtx.lineTo(x + baseLength * 0.75 + growth, y + baseLength * 1.0 + growth);
    //#endregion

    UiCtx.strokeStyle = userColor;
    UiCtx.stroke();

    setTimeout(() => {
      requestAnimationFrame(animate);
    }, 1000 / fps);
  }

  function drawBoard() {
    for (var x = 0; x <= bw; x += 40) {
      DrawCtx.moveTo(0.5 + x + pad, pad);
      DrawCtx.lineTo(0.5 + x + pad, bh + pad);
    }

    for (var x = 0; x <= bh; x += 40) {
      DrawCtx.moveTo(pad, 0.5 + x + pad);
      DrawCtx.lineTo(bw + pad, 0.5 + x + pad);
    }
    DrawCtx.strokeStyle = "black";
    DrawCtx.stroke();
  }

  document.addEventListener("mousemove", function (e) {
    // Get transform
    // https://roblouie.com/article/617/transforming-mouse-coordinates-to-canvas-coordinates/
    const transform = DrawCtx.getTransform();

    // Get Coords (Snap to Grip) *
    x = Math.floor(e.offsetX / baseLength) * baseLength;
    y = Math.floor(e.offsetY / baseLength) * baseLength;
  });

  document.addEventListener("mousedown", function (e) {

    rect = DrawCanvas.getBoundingClientRect()
    left = rect.left;
    right = rect.right;
    bot = rect.bottom;
    // top = bot - rect.height
    absX = e.clientX;
    absY = e.clientY;
    
    if(absX >= left && absX <= right && absY >= rect.top && absY <= bot){

    DrawCtx.beginPath();
    DrawCtx.rect(x, y, baseLength, baseLength);
    DrawCtx.fillStyle = drawColor;
    DrawCtx.fill();
    console.log("fill X " + x + " Y " + y);

    let msg = DrawCanvas.toDataURL();
    // console.log(msg);

    socket.emit("canvasDraw", JSON.stringify({ user: txtUser.value.trim(), msg }));
    }
  });
});

const userLeft = (user) => {
  chatcontainer.innerHTML += `<div>${user} has left chat at ${new Date()} </div>`;
};

const userJoin = (user) => {
  chatcontainer.innerHTML += `<div>${user} has joined chat at ${new Date()}</div>`;
};

const loadUsers = (users) => {
  usersList.innerHTML = ``;
  userList = users;

  for (const u of users) {
    usersList.innerHTML += `<span>${u.user}</span>`;
  }
};

btnLeave.onclick = (e) => {
  userDiv.classList.toggle("hide");
  chatDiv.classList.toggle("hide");
  txtUser.value = "";
  txtChat.value = "";
  socket.disconnect();
};

// btnSend.onclick = (e) => {
//   const msg = txtChat.value;
//   txtChat.value = "";

//   socket.emit(
//     "chatMessage",
//     JSON.stringify({
//       user: txtUser.value.trim(),
//       msg,
//     })
//   );
// };

// The scaling error is probably due the event listeners listening to the dom instead of specific canvas.
// find a way to allow one event listening too look at both UI Canvas and Draw Canavs.

window.addEventListener("load", function () {
  

  // let socket = {};
  // socket = io(); // cpnnect to socket
});
