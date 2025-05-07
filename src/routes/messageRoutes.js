const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const PendingMessage = require('../models/pendingMessage');
const { Op } = require('sequelize');

// Send a message
router.post('/send', async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                success: false,
                message: 'Phone number and message are required'
            });
        }

        // Clean the phone number
        const cleanPhone = to.replace(/\D/g, '');

        const result = await whatsappService.sendMessage(cleanPhone, message);

        res.json({
            success: true,
            message: 'Message sent successfully',
            data: result
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send message'
        });
    }
});

// Get message history
router.get('/history', async (req, res) => {
    try {
        const messages = await PendingMessage.findAll({
            order: [['createdAt', 'DESC']],
            limit: 50 // Limit to last 50 messages
        });

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Error fetching message history:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch message history'
        });
    }
});

// Get pending messages
router.get('/pending', async (req, res) => {
    try {
        const pendingMessages = await PendingMessage.findAll({
            where: {
                status: {
                    [Op.in]: ['pending', 'failed']
                }
            },
            order: [['createdAt', 'ASC']]
        });

        res.json({
            success: true,
            data: pendingMessages
        });
    } catch (error) {
        console.error('Error fetching pending messages:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch pending messages'
        });
    }
});

// Retry failed messages
router.post('/retry', async (req, res) => {
    try {
        const { messageId } = req.body;

        if (!messageId) {
            return res.status(400).json({
                success: false,
                message: 'Message ID is required'
            });
        }

        const message = await PendingMessage.findByPk(messageId);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Attempt to resend the message
        await whatsappService.sendMessage(message.to, message.message);

        // Update message status
        await message.update({
            status: 'completed',
            completedAt: new Date()
        });

        res.json({
            success: true,
            message: 'Message resent successfully'
        });
    } catch (error) {
        console.error('Error retrying message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to retry message'
        });
    }
});

module.exports = router;
