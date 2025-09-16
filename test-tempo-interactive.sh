#!/bin/bash

# Start the app in background and capture output
echo "Starting app..."
npm start 2>&1 | tee test-tempo-run.log &
APP_PID=$!

# Wait for app to start
sleep 3

echo "App started. Testing tempo changes..."
echo "Initial state should be 120 BPM"

# Send 'T' key to increase tempo (should go to 140)
echo "Pressing 'T' to increase tempo..."
echo -ne "t" > /dev/stdin

sleep 2

# Send 'T' again (should go to 160)
echo "Pressing 'T' again..."
echo -ne "t" > /dev/stdin

sleep 2

# Send Shift+T to decrease (should go back to 140)
echo "Pressing Shift+T to decrease tempo..."
echo -ne "T" > /dev/stdin

sleep 2

echo "Stopping app..."
kill $APP_PID

echo "Check test-tempo-run.log for output"