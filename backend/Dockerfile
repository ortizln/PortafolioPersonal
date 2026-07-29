FROM node:20

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY src ./src/

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate resolve --applied 20260508204122_init 2>/dev/null; npx prisma migrate deploy && node src/app.js"]
