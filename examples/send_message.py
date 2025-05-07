import requests
import json

def send_whatsapp_message(phone_number: str, message: str) -> dict:
    """
    Send a WhatsApp message using the API.
    
    Args:
        phone_number (str): The recipient's phone number (format: country code + number, e.g., "6281234567890")
        message (str): The message to send
    
    Returns:
        dict: The API response
    """
    url = "http://localhost:3000/api/messages/send"
    
    # Prepare the request payload
    payload = {
        "to": phone_number,
        "message": message
    }
    
    # Set headers
    headers = {
        "Content-Type": "application/json"
    }
    
    try:
        # Send POST request to the API
        response = requests.post(url, json=payload, headers=headers)
        
        # Raise an exception for bad status codes
        response.raise_for_status()
        
        # Return the JSON response
        return response.json()
    
    except requests.exceptions.RequestException as e:
        print(f"Error sending message: {e}")
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    # Example usage
    phone_number = "6281234567890"  # Replace with the recipient's phone number
    message = "Hello from Python! This is a test message."
    
    print("Sending WhatsApp message...")
    result = send_whatsapp_message(phone_number, message)
    
    if result.get("success"):
        print("Message sent successfully!")
    else:
        print(f"Failed to send message: {result.get('message')}")
