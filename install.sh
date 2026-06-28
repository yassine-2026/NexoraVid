#!/bin/bash
echo "Installing dependencies..."
npm install

echo "Installing Puppeteer chromium..."
npx puppeteer browsers install chrome

echo "Installation complete."
