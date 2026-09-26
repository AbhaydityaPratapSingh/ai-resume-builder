# Built from the repo root (see render.yaml/deploy notes: dockerContext ".",
# dockerfilePath "backend/Dockerfile") — this is an npm workspaces monorepo,
# so `npm ci` needs the root package-lock.json plus every workspace's
# package.json (frontend/ included, even though this image never builds it)
# to resolve correctly.
FROM node:22-slim

# Puppeteer's own Chromium download frequently fails or times out in a
# container build sandbox, and needs a long list of system libraries that
# aren't in the base image anyway. Installing the distro's chromium package
# pulls in everything it needs via apt, and PUPPETEER_SKIP_CHROMIUM_DOWNLOAD
# stops `npm ci` from also trying (and failing) to fetch its own copy.
RUN apt-get update && apt-get install -y --no-install-recommends chromium \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

# Copy only what's needed to resolve dependencies first, so `npm ci` is
# cached across builds that only change application code.
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY shared/package.json shared/package.json
RUN npm ci

COPY shared shared
COPY backend backend

EXPOSE 3001
CMD ["npm", "run", "start", "--workspace", "backend"]
