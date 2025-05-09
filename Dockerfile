
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
RUN cp -r /app/signalk-barometer-trend/settings.json ~/.signalk/
RUN mkdir -p ~/.signalk/plugin-config-data/
RUN cp -r /app/signalk-barometer-trend/signalk-barometer-trend.json ~/.signalk/plugin-config-data/

# Switch back to the signalk user
#USER node

# Expose the SignalK default port
EXPOSE 3000

# Set the entrypoint to run the SignalK server
CMD ["node", "/app/signalk-server.js"]


#run from parent folder of the two:
#docker build -f signalk-barometer-trend/Dockerfile -t my-signalk-server .
#docker run -it --rm -v ~/.signalk:/home/signalk/.signalk -p 3000:3000 -p 8375:8375 my-signalk-server
#With DEBUG
#docker run -it --rm -e DEBUG=signalk:* -v ~/.signalk:/home/signalk/.signalk -p 3000:3000 -p 8375:8375 my-signalk-server
#docker run -it --rm -e DEBUG=signalk:*,signalk:interfaces:ws -v ~/.signalk:/home/signalk/.signalk -p 3000:3000 -p 8375:8375 my-signalk-server
#-e DEBUG=signalk:*,signalk:interfaces:ws