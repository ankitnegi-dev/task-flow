# --- TaskFlow API - Dockerfile ---
#
# Builds a minimal production image for the TaskFlow Node.js API.
# Uses node:20-alpine for a small footprint.
#
# Build:  docker build -t taskflow-server .
# Run:    docker run -p 5000:5000 --env-file .env taskflow-server
#
# NOTE: prisma migrate deploy runs at container startup (see docker-compose.yml
#       command). For production use a separate migration job / init container
#       rather than running migrations inside the app process.

FROM node:20-alpine

# Prisma on Alpine needs OpenSSL explicitly to detect the correct query engine.
# Without this, Prisma falls back to guessing the OpenSSL version, which can
# cause runtime errors or the "failed to detect libssl" warning.
RUN apk add --no-cache openssl

# Set working directory inside the container
WORKDIR /app

# Copy only the dependency manifests first so Docker can cache the npm install
# layer and avoid re-running it on every code change.
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy application source code
COPY . .

# Generate the Prisma client from the schema included in the image.
# This must run after the source copy so prisma/schema.prisma is available.
RUN npx prisma generate

# Expose the port the API listens on (matches default PORT env var)
EXPOSE 5000

# Give the non-root 'node' user ownership of the app directory.
# This must happen BEFORE switching to USER node below, otherwise commands
# that touch node_modules at container startup (e.g. `prisma migrate deploy`,
# which can re-check/re-generate engine binaries) will fail with an
# "Can't write to node_modules/@prisma/engines" permission error, since
# everything up to this point was created as root during the build.
RUN chown -R node:node /app

# Use the non-root node user provided by the base image for security
USER node

# Start the API server
CMD ["node", "src/index.js"]