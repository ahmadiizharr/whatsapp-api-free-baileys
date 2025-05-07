const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const fs = require('fs').promises;
const path = require('path');

// Get device connection status
router.get('/status', (req, res) => {
    try {
        const status = whatsappService.getConnectionStatus();
        res.json(status);
    } catch (error) {
        console.error('Error getting device status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get device status'
        });
    }
});

// Delete session and auth files
router.delete('/session', async (req, res) => {
    try {
        // Delete session using WhatsApp service
        await whatsappService.deleteSession();

        // Delete database file
        const dbPath = path.join(__dirname, '../../database.sqlite');
        try {
            await fs.unlink(dbPath);
            console.log('Database file deleted');
        } catch (error) {
            console.warn('Error deleting database file:', error);
        }

        // Reinitialize the database
        const { initDatabase } = require('../database/config');
        await initDatabase();

        // Reseed the database
        const { seedAutoreplies } = require('../database/seedData');
        await seedAutoreplies();

        res.json({
            success: true,
            message: 'Session deleted and database reinitialized successfully'
        });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete session'
        });
    }
});

module.exports = router;
