# Set global constants
ARG NODE_VERSION=18.14.2
ARG NODE_ENV=production
# 1) Create the fully built app
FROM node:${NODE_VERSION} as full_app_build
ARG NODE_ENV

RUN mkdir /full-source
WORKDIR /full-source
COPY . .
ENV NODE_ENV production
RUN npm install
RUN npm run ci:create-app

#######################################################################
#######################################################################
#######################################################################

# 2) Create the bundle, including the built Client app
FROM debian:bullseye as bundler
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

# Copy in the already built app bundle code
COPY --from=full_app_build /full-source .

#######################################################################
#######################################################################
#######################################################################

# 3) Finalize the final running server
FROM debian:bullseye as main_runner
ARG NODE_VERSION
ARG NODE_ENV

LABEL fly_launch_runtime="nodejs"
EXPOSE 3000

# Copy in Volta for global npm access
COPY --from=bundler /root/.volta /root/.volta
ENV PATH /root/.volta/bin:$PATH

# Copy in our full app
COPY --from=bundler /app /app

ENV NODE_ENV ${NODE_ENV}

WORKDIR /app

# Start our application with the server's package.json's version of "npm run start"
CMD [ "npm", "run", "start:server:ci-stop-gap" ]
