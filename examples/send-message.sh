#!/bin/bash

# Replace these values with your actual phone number and message
PHONE_NUMBER="6281234567890"
MESSAGE="Hello from WhatsApp API!"

# Send message using curl
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"$PHONE_NUMBER\",\"message\":\"$MESSAGE\"}"

# Note: For Windows PowerShell, use this command instead:
# $body = @{
#     to = "6281234567890"
#     message = "Hello from WhatsApp API!"
# } | ConvertTo-Json
# 
# Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/messages/send" -Body $body -ContentType "application/json"
