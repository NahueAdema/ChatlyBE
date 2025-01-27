import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

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
    const sendId = req.user._id;

    const messages = Message.find({
      $or: [
        { sendId: sendId, receiveId: userChatId },
        { sendId: userChatId, receiveId: sendId },
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
    const { id: receiveId } = req.params;
    const sendId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      sendId,
      receiveId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    //Funcionalidad para que funcione a tiempo real

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Erorr en enviar el mensage", error.message);
    res.status(500).json({ error: "Error del servidor" });
  }
};
