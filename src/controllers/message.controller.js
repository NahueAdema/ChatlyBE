import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSideBar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error en obtener usuarios para sidebar", error.message);
    res.status(500).json({ message: "Error en el servidor" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userChatId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: userChatId },
        { senderId: userChatId, receiverId: senderId },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error en obtener los mensajes:", error.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId: senderId,
      receiverId: receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    // Enviar a través de Socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    // Enviar también al chat específico (mejora para mayor fiabilidad)
    const chatId1 = `${senderId}-${receiverId}`;
    const chatId2 = `${receiverId}-${senderId}`;
    io.to(chatId1).to(chatId2).emit("newMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error en enviar el mensaje", error.message);
    res.status(500).json({ error: "Error del servidor" });
  }
};
