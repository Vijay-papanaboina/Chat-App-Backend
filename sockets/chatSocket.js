// sockets/chatSocket.js
const multer = require("multer");
const upload = multer();

module.exports = (io, pool) => {
  // Object to track connected users: maps userId to socket.id
  const connectedUsers = {};

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // When a user registers, save their userId with socket.id
    socket.on("registerUser", (userId) => {
      connectedUsers[userId] = socket.id;
      console.log("Online Users:", Object.keys(connectedUsers).length);
      io.emit("onlineUsers", Object.keys(connectedUsers));
    });

    // Message sending remains unchanged
    socket.on("sendMessage", async (data) => {
      const { sender, receiver, message_text } = data;
      try {
        const result = await pool.query(
          "INSERT INTO messages (sender, receiver, message_text) VALUES ($1, $2, $3) RETURNING *",
          [sender, receiver, message_text]
        );
        const message = result.rows[0];

        if (connectedUsers[receiver]) {
          io.to(connectedUsers[receiver]).emit("newMessage", message);
        }
        io.to(socket.id).emit("newMessage", message);
        console.log("newMessage", message);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    socket.on("markAsRead", async ({ chat_id, user_id }) => {
      try {
        await pool.query(
          `UPDATE messages SET message_read = true 
           WHERE sender = $1 AND receiver = $2 AND message_read = false`,
          [chat_id, user_id]
        );

        if (connectedUsers[chat_id]) {
          io.to(connectedUsers[chat_id]).emit("messagesRead", {
            chat_id,
            user_id,
          });
        }
        console.log(`Messages marked as read for chat: ${chat_id}`);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // --- Call Signaling Events ---

    // When a user initiates a call, forward the call request to the receiver
    socket.on("callUser", ({ to, signalData, from, callerName }) => {
      if (connectedUsers[to]) {
        console.log(`Call from ${from} to ${to} initiated.`);
        io.to(connectedUsers[to]).emit("callIncoming", {
          signal: signalData,
          from,
          callerName,
        });
      } else {
        console.log(`User ${to} is not connected.`);
      }
    });

    // When the caller cancells the call, forward the answer signal to the caller
    socket.on("cancelCall", ({ to }) => {
      console.log("Call cancelled event received for user:", to);
      if (connectedUsers[to]) {
        io.to(connectedUsers[to]).emit("callCancelled");
      }
    });

    // When the callee accepts the call, forward the answer signal to the caller
    socket.on("acceptCall", ({ signal, to }) => {
      if (connectedUsers[to]) {
        console.log(`Call accepted. Sending answer signal to ${to}.`);
        io.to(connectedUsers[to]).emit("callAccepted", { signal });
      }
    });

    // When the callee rejects the call, notify the caller
    socket.on("rejectCall", ({ to }) => {
      if (connectedUsers[to]) {
        console.log(`Call rejected by recipient ${to}.`);
        io.to(connectedUsers[to]).emit("callRejected");
      }
    });

    // When the call ends, notify the other party
    socket.on("endCall", ({ to }) => {
      if (connectedUsers[to]) {
        console.log(`Call ended. Notifying ${to}.`);
        io.to(connectedUsers[to]).emit("callEnded");
      }
    });

    // Handle disconnection: Remove user from connectedUsers
    socket.on("disconnect", () => {
      for (const userId in connectedUsers) {
        if (connectedUsers[userId] === socket.id) {
          delete connectedUsers[userId];
          console.log("User disconnected:", socket.id);
          console.log("Registered Users:", Object.keys(connectedUsers).length);
          io.emit("onlineUsers", Object.keys(connectedUsers));
          break;
        }
      }
    });
  });
};
