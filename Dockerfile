# Use an official Node.js runtime as the base image
FROM node:21-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
# This step is done separately to leverage Docker caching for dependencies
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Expose the port the app runs on
EXPOSE 8080

# Define the command to run the application
# This is the command that gets executed when the container starts
CMD [ "npm", "run", "dev" ]