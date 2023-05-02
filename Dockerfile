# Set global constants
ARG NODE_VERSION=18.16.0
ARG NODE_ENV=production
# 1) Create the fully built app
FROM node:${NODE_VERSION}-alpine3.17 as full_app_build
ARG NODE_ENV

RUN mkdir /full-source
WORKDIR /full-source
COPY . .
ENV NODE_ENV production
RUN npm ci
# output will be in:
# client: /full-source/packages/client/dist
# server: /full-source/packages/server/distribution
# client bundled with server /full-source/packages/server/client
RUN npm run ci:create-app

#######################################################################
#######################################################################
#######################################################################

# 2) Finalize the final running server
FROM node:18.16.0-alpine3.17 as main_runner
ARG NODE_VERSION
ARG NODE_ENV

LABEL fly_launch_runtime="nodejs"
EXPOSE 3000

# Copy in Volta for global npm access
# COPY --from=bundler /root/.volta /root/.volta
# ENV PATH /root/.volta/bin:$PATH

WORKDIR /app

# Copy in our full app
# COPY --from=bundler /app /app
COPY --from=full_app_build /full-source/packages/server/distribution/ ./distribution/
COPY --from=full_app_build /full-source/packages/server/client/ ./client/

ENV NODE_ENV ${NODE_ENV}

# Start our application with the server's package.json's version of "npm run start"
CMD [ "node", "distribution/server.js" ]
