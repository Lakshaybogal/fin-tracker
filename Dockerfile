FROM node:22-alpine3.20

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json files into the working directory
COPY ./package*.json ./

# List the contents of the current directory for debugging
RUN echo "Listing contents after copying package.json:" && ls -la

# Install the npm dependencies
RUN npm install

# List the contents of the current directory again to verify the installation
RUN echo "Listing contents after npm install:" && ls -la

# Copy all the source code into the working directory
COPY . .

# List the contents again to ensure everything is copied correctly
RUN echo "Listing contents after copying source files:" && ls -la

# Expose the application port
EXPOSE 5001

# Start the application
CMD ["npm", "start"]
