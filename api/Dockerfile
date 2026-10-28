FROM node:20-alpine

WORKDIR /app

# Copia manifesto de dependências primeiro para aproveitar o cache do Docker
COPY package.json package-lock.json* ./

RUN npm ci --omit=dev

# Copia o restante do código-fonte
COPY . .

EXPOSE 3000

CMD ["node", "src/app.js"]
