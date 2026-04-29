FROM node:20-alpine

WORKDIR /app

COPY ./app/package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node ./app ./
RUN mkdir -p /app/public/uploads && chown -R node:node /app

EXPOSE 3000
VOLUME /app/public/uploads

USER node

CMD ["node", "main.js"]
