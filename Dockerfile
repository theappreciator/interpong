# Set global constants
ARG NODE_VERSION=16.19.0
ARG NODE_ENV=production
# 1) Create the built React app
FROM node:${NODE_VERSION} as client_build
ARG NODE_ENV

WORKDIR /react-app
COPY ./frontend/ .
ENV NODE_ENV production
RUN npm ci
RUN npm run build

#######################################################################
#######################################################################
#######################################################################

# 2) Create the bundle, including the built React app
FROM debian:bullseye as builder
ARG NODE_VERSION
ARG NODE_ENV

# update and install Volta to help with npm global/local installs
RUN apt-get update; apt install -y curl python-is-python3 pkg-config build-essential
RUN curl https://get.volta.sh | bash
ENV VOLTA_HOME /root/.volta
ENV PATH /root/.volta/bin:$PATH
RUN volta install node@${NODE_VERSION}
RUN npm install --global nodemon
RUN npm install --global ts-node typescript '@types/node'

ENV NODE_ENV ${NODE_ENV}

# Make a place for our code
RUN mkdir /app

# Copy in the server code
WORKDIR /app

COPY *.json .
COPY *.env* .
COPY ./src/ ./src

RUN npm ci

# Copy in the already built frontend code
COPY --from=client_build /react-app/build ./frontend/build

#######################################################################
#######################################################################
#######################################################################

# 3) Finalize the final running server
FROM debian:bullseye as main_runner
ARG NODE_VERSION
ARG NODE_ENV

LABEL fly_launch_runtime="nodejs"

# Copy in Volta for global npm access
COPY --from=builder /root/.volta /root/.volta
ENV PATH /root/.volta/bin:$PATH

# Copy in our full app
COPY --from=builder /app /app

ENV NODE_ENV ${NODE_ENV}

WORKDIR /app

# Start our application with the server's package.json's version of "npm run start"
CMD [ "npm", "run", "start" ]
