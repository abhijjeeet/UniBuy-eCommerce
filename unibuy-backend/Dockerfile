# Use the official Node.js 20 image
FROM node:20.11.0

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (if available) to the container
COPY package.json /app
COPY package-lock.json /app

# Install the dependencies
RUN npm install

# Copy the rest of the application code into the container
COPY . /app

# Install TypeScript globally if not already in package.json
RUN npm install -g typescript

# Set the default port for the application
ARG DEFAULT_PORT=80
ENV PORT $DEFAULT_PORT

# Expose the port
EXPOSE $PORT

RUN npm run prisma
RUN npm run build

# Start the application using Node.js (after TypeScript is compiled)
CMD ["npm", "run", "deploy"]

