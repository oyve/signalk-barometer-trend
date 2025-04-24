
# Use the official SignalK Docker image
FROM signalk/signalk-server:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the signalk-barometer-trend plugin into the container
COPY ./signalk-barometer-trend /app/signalk-barometer-trend

# Copy the barometer-trend package into the container
COPY ../barometer-trend /app/barometer-trend

# Elevate to root user to install dependencies
USER root

# Install dependencies for the barometer-trend package
WORKDIR /app/barometer-trend
RUN npm install --unsafe-perm
RUN npm link

# Install dependencies for the signalk-barometer-trend plugin
WORKDIR /app/signalk-barometer-trend
RUN npm install
RUN npm link barometer-trend

RUN mkdir -p ~/.signalk/node_modules
RUN cp -r /app/signalk-barometer-trend ~/.signalk/node_modules/signalk-barometer-trend
RUN cp -r /app/barometer-trend ~/.signalk/node_modules/barometer-trend
RUN cp -r /app/signalk-barometer-trend/security.json ~/.signalk/

# Switch back to the signalk user
#USER node

# Expose the SignalK default port
EXPOSE 3000

# Set the entrypoint to run the SignalK server
CMD ["node", "/app/signalk-server.js"]


#run from parent folder of the two:
#docker build -f signalk-barometer-trend/Dockerfile -t my-signalk-server .
#docker run -it --rm --no-create-admin -v ~/.signalk:/home/signalk/.signalk -p 3000:3000 my-signalk-server --no-create-admin
