const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const whatsappService = require('./src/services/whatsappService');
const { initDatabase } = require('./src/database/config');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize database and WhatsApp service
async function initialize() {
    try {
        // Initialize database first
        await initDatabase();
        console.log('Database initialization completed');

        // Then initialize WhatsApp service
        await whatsappService.initialize().catch(err => {
            console.error('Failed to initialize WhatsApp service:', err);
        });
    } catch (error) {
        console.error('Initialization error:', error);
        process.exit(1);
    }
}

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Send message page
app.get('/send-message', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'send-message.html'));
});

// Webhook management page
app.get('/gen-webhooks', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'gen-webhooks.html'));
});

// Import routes
const messageRoutes = require('./src/routes/messageRoutes');
const deviceRoutes = require('./src/routes/deviceRoutes');
const webhookRoutes = require('./src/routes/webhookRoutes');
const autoreplyRoutes = require('./src/routes/autoreplyRoutes');

// Use routes
app.use('/api/messages', messageRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/autoreplies', autoreplyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    initialize();
});

// Handle process termination
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Cleaning up...');
    await whatsappService.deleteSession();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('Received SIGINT. Cleaning up...');
    await whatsappService.deleteSession();
    process.exit(0);
});
