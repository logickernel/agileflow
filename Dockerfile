FROM node:20-alpine
WORKDIR /opt/agileflow
COPY package.json ./
COPY bin ./bin
COPY lib ./lib
RUN npm link && agileflow version
ENTRYPOINT [""]
