FROM node:20-slim

WORKDIR /app

# Instala dependências básicas
COPY package*.json ./
RUN npm install

# Copia o código fonte
COPY . .

# Expõe a porta (padrão 4000 conforme seu index.js)
EXPOSE 4000

# Comando para iniciar
CMD ["npm", "start"]
