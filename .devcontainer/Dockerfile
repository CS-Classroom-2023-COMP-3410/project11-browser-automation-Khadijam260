# FROM node:22

# # Install basic development tools
# RUN apt update && apt install -y less man-db sudo

# # Ensure default `node` user has access to `sudo`
# ARG USERNAME=node
# RUN echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
#     && chmod 0440 /etc/sudoers.d/$USERNAME

# # Set `DEVCONTAINER` environment variable to help with orientation
# ENV DEVCONTAINER=true


# # Use an ARM64-compatible base image
# FROM --platform=linux/arm64 node:latest

# # Install dependencies
# RUN apt-get update && apt-get install -y \
#     wget \
#     curl \
#     gnupg \
#     libnss3 \
#     libatk1.0-0 \
#     libatk-bridge2.0-0 \
#     libcups2 \
#     libxcomposite1 \
#     libxdamage1 \
#     libxrandr2 \
#     libgbm-dev \
#     libasound2 \
#     libpangocairo-1.0-0 \
#     libpango-1.0-0 \
#     libxcursor1 \
#     libxi6 \
#     libxss1 \
#     libgtk-3-0 \
#     fonts-liberation \
#     xdg-utils \
#     ca-certificates \
#     && rm -rf /var/lib/apt/lists/*

# # Install Chromium manually (works for ARM64)
# RUN apt-get update && apt-get install -y chromium-browser

# # Set environment variables to tell Puppeteer to use system-installed Chromium
# ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
#     PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# # Install Puppeteer (without Chromium)
# RUN npm install puppeteer

# # Set working directory
# WORKDIR /app
# COPY . /app

# CMD ["node", "app.js"]

FROM node:22

RUN apt-get update \
 && apt-get install -y chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends
    
USER node # non-root user that comes with `node` images.

WORKDIR /app

COPY --chown=node package.json .
COPY --chown=node package-lock.json .

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH /usr/bin/chromium

RUN npm install

COPY --chown=node . /app