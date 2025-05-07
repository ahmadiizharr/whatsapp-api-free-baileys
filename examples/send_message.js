const axios = require('axios');

/**
 * Send a WhatsApp message using the API
 * @param {string} phoneNumber - The recipient's phone number (format: country code + number, e.g., "6281234567890")
 * @param {string} message - The message to send
 * @returns {Promise<object>} The API response
 */
async function sendWhatsAppMessage(phoneNumber, message) {
    const url = 'http://localhost:3000/api/messages/send';
    
    // Prepare the request payload
    const payload = {
        to: phoneNumber,
        message: message
    };
    
    try {
        // Send POST request to the API
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error.response?.data || error.message);
        throw error;
    }
}

// Example usage
async function main() {
    const phoneNumber = '6281234567890'; // Replace with the recipient's phone number
    const message = 'Hello from Node.js! This is a test message.';
    
    try {
        console.log('Sending WhatsApp message...');
        const result = await sendWhatsAppMessage(phoneNumber, message);
        
        if (result.success) {
            console.log('Message sent successfully!');
        } else {
            console.log('Failed to send message:', result.message);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the example if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}

// Export the function for use in other files
module.exports = sendWhatsAppMessage;
