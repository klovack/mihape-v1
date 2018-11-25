FROM node:dubnium

LABEL author="Muhammad Rizki Fikriansyah"

WORKDIR /var/www/kintun

COPY . .

RUN npm install && npm install nodemon -g

EXPOSE 3000

CMD ["nodemon", "index.js"]