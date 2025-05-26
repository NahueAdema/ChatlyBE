import { Server } from "socket.io";
import express from "express";
import http from "http";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    credentials: true,
  },
});

// Mapa para almacenar las conexiones de los usuarios
const userSocketMap = {};

// Función para obtener el ID del socket de un usuario
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// Manejar conexiones de Socket.IO
io.on("connection", (socket) => {
  console.log("Usuario conectado", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;
    console.log(`Usuario ${userId} mapeado a socket ${socket.id}`);
  }

  // Enviar la lista de usuarios conectados a todos los clientes
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Manejar cuando un usuario se une a un chat específico
  socket.on("joinChat", (chatId) => {
    console.log(`Usuario ${socket.id} se unió al chat: ${chatId}`);
    socket.join(chatId);
  });

  // Manejar el envío de mensajes directamente desde el cliente
  socket.on("sendMessage", (message) => {
    const { receiverId } = message;
    const receiverSocketId = userSocketMap[receiverId];

    // Enviar al receptor específico si está conectado
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }

    // También emitir al chat específico (ambas direcciones para mayor seguridad)
    const chatId1 = `${message.senderId}-${message.receiverId}`;
    const chatId2 = `${message.receiverId}-${message.senderId}`;
    io.to(chatId1).to(chatId2).emit("newMessage", message);
  });

  // Manejar eventos de "está escribiendo"
  socket.on("typing", ({ chatId, userId: typingUserId }) => {
    socket
      .to(chatId)
      .emit("userTyping", { userId: typingUserId, isTyping: true });
  });

  socket.on("stopTyping", ({ chatId, userId: typingUserId }) => {
    socket
      .to(chatId)
      .emit("userTyping", { userId: typingUserId, isTyping: false });
  });

  // Manejar la desconexión del usuario
  socket.on("disconnect", () => {
    console.log("Usuario desconectado", socket.id);

    // Encontrar y eliminar el usuario del mapa
    const userIdToRemove = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket.id
    );

    if (userIdToRemove) {
      console.log(`Eliminando usuario ${userIdToRemove} del mapa`);
      delete userSocketMap[userIdToRemove];
    }

    // Informar a todos los clientes sobre la actualización de usuarios conectados
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, server, io };
