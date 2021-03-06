FROM node:latest

LABEL author="Muhammad Rizki Fikriansyah"

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

RUN npm install pm2 -g

# Bundle app source
COPY . /usr/src/app

# Set the node env variable
ARG node_env

ENV NODE_ENV=production

EXPOSE 3000

CMD [ "pm2-docker", "/usr/src/app/index.js" ]
