#!/bin/bash

# Monitor FTP uploads and notify backend API
# This script watches for new video files and registers them in the database

FTP_ROOT="/var/ftp"
API_URL="http://localhost:3000/videos"

# Install inotify-tools if not present
if ! command -v inotifywait &> /dev/null; then
  echo "Installing inotify-tools..."
  sudo apt install -y inotify-tools
fi

echo "Monitoring FTP uploads in $FTP_ROOT..."
echo "API endpoint: $API_URL"

# Watch for new files
inotifywait -m -r -e close_write --format '%w%f' "$FTP_ROOT" | while read FILE
do
  # Only process video files
  if [[ $FILE =~ \.(mp4|avi|mkv|mov)$ ]]; then
    echo "New video detected: $FILE"
    
    # Extract info from path
    FILENAME=$(basename "$FILE")
    FILEPATH=${FILE#$FTP_ROOT/}
    FILESIZE=$(stat -c%s "$FILE")
    
    # Extract deviceId from path (assuming format: cam_userId_deviceId/...)
    DIRNAME=$(dirname "$FILEPATH")
    if [[ $DIRNAME =~ cam_([0-9]+)_([a-zA-Z0-9]+) ]]; then
      USER_ID=${BASH_REMATCH[1]}
      DEVICE_ID=${BASH_REMATCH[2]}
      
      # Call API to register video
      curl -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "{
          \"deviceId\": $DEVICE_ID,
          \"filename\": \"$FILENAME\",
          \"filepath\": \"$FILEPATH\",
          \"filesize\": $FILESIZE
        }"
      
      echo "Video registered in database"
    fi
  fi
done
