FROM node:20-alpine
WORKDIR /opt/agileflow
COPY package.json ./
COPY bin ./bin
COPY src ./src
RUN npm link && agileflow version
ENTRYPOINT [""]
