FROM node:18-alpine

# Establecer directorio de trabajo
WORKDIR /app

# Instalar dependencias necesarias del sistema 
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar y instalar dependencias
COPY package*.json ./
RUN npm ci --omit=dev

# Copiar el resto de los archivos
COPY . .

# Exponer el puerto
EXPOSE 5001

# Comando para correr la app
CMD ["npm", "start"]
