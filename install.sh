#!/bin/bash

# Preconfigured URL
URL="https://code.logickernel.com/kernel/agileflow/-/raw/HEAD/agileflow"
FILENAME=$(basename "$URL")

# Check if the file exists before downloading
if [ -f "$FILENAME" ]; then
  FILE_EXISTED_BEFORE=true
else
  FILE_EXISTED_BEFORE=false
fi

# Download the file using curl and overwrite if it exists
curl -s -O "$URL"

# Ensure the file has execution permissions
chmod +x "$FILENAME"

# Only execute the file if it did not exist before
if [ "$FILE_EXISTED_BEFORE" = false ]; then
  echo "Running $FILENAME..."
  ./"$FILENAME" install
else
  echo "AgileFlow was already installed so it was just updated. To perform a fresh install, please remove the existing installation and run the script again."
fi