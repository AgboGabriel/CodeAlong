FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy dependency manifests first for caching
COPY Frontend/package*.json ./Frontend/
COPY Backend/package*.json ./Backend/

# Install frontend dependencies
RUN npm install --prefix ./Frontend

# Install backend dependencies
RUN npm install --prefix ./Backend

# Copy the actual source code
COPY Frontend ./Frontend
COPY Backend ./Backend

# Build the frontend so the backend can serve the generated dist files
RUN npm run build --prefix ./Frontend

WORKDIR /app/Backend

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start"]
