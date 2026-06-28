#!/bin/bash
if [ ! -f ./yt-dlp ]; then
    echo "Downloading yt-dlp..."
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux -o yt-dlp
    chmod +x yt-dlp
fi
