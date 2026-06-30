FROM node:18-alpine
WORKDIR /app
COPY package.json tsconfig.json ./
COPY src ./src
RUN npm install --silent || true
RUN npm run build || true
CMD ["npm","start"]
