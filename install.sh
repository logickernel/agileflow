#!/bin/bash

# Preconfigured URL
URL="https://code.logickernel.com/kernel/agileflow/-/raw/HEAD/agileflow"
FILENAME=$(basename "$URL")

# Download the file using curl
echo "Downloading $FILENAME from $URL..."
curl -O "$URL"

chmod +x "$FILENAME"

# Execute the file with --init flag
./"$FILENAME" init