#!/bin/bash

# Preconfigured URL
URL="https://example.com/file-to-download.sh"
FILENAME=$(basename "$URL")

# Download the file using curl
echo "Downloading $FILENAME from $URL..."
curl -O "$URL"

# Give execution permissions to the file
echo "Setting execution permissions for $FILENAME..."
chmod +x "$FILENAME"

# Execute the file with --init flag
echo "Executing $FILENAME with --init flag..."
./"$FILENAME" --init