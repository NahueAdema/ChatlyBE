import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "14d",
  });

  res.cookie("jwt", token, {
    httpOnly: true, //Evita ataques XSS (Cross Site Scripting)
    sameSite: "strict", //Solo se envia si el dominio es el mismo
    secure: process.env.NODE_ENV !== "development", // solo se envia si es https
    maxAge: 14 * 24 * 60 * 60 * 1000, // Milisegundos
  });

  return token;
};
