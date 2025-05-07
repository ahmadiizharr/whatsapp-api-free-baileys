const express = require('express');
const router = express.Router();
const PendingMessage = require('../models/pendingMessage');
const whatsappService = require('../services/whatsappService');
const { Op } = require('sequelize');

// Get all pending messages
router.get('/', async (req, res) => {
    try {
        const pendingMessages = await PendingMessage.findAll({
            order: [['createdAt', 'DESC']]
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

// Mark message as completed
router.post('/:id/complete', async (req, res) => {
    try {
        const message = await PendingMessage.findByPk(req.params.id);
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Pending message not found'
            });
        }

        message.status = 'completed';
        message.completedAt = new Date();
        await message.save();

        res.json({
            success: true,
            message: 'Message marked as completed',
            data: message
        });
    } catch (error) {
        console.error('Error completing message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to complete message'
        });
    }
});

// Resend a pending message
router.post('/resend/:id', async (req, res) => {
    try {
        const message = await PendingMessage.findByPk(req.params.id);
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Pending message not found'
            });
        }

        try {
            await whatsappService.sendMessage(message.to, message.message);
            
            message.status = 'completed';
            message.completedAt = new Date();
            await message.save();

            res.json({
                success: true,
                message: 'Message resent and completed successfully'
            });
        } catch (error) {
            message.attempts += 1;
            message.lastAttempt = new Date();
            await message.save();

            throw error;
        }
    } catch (error) {
        console.error('Error resending message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to resend message'
        });
    }
});

// Delete a pending message
router.delete('/:id', async (req, res) => {
    try {
        const result = await PendingMessage.destroy({
            where: { id: req.params.id }
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Pending message not found'
            });
        }

        res.json({
            success: true,
            message: 'Pending message deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting pending message:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete pending message'
        });
    }
});

// Get pending messages count by status
router.get('/count', async (req, res) => {
    try {
        const counts = await PendingMessage.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: ['status']
        });

        res.json({
            success: true,
            data: counts
        });
    } catch (error) {
        console.error('Error getting message counts:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get message counts'
        });
    }
});

// Delete completed messages
router.delete('/cleanup/completed', async (req, res) => {
    try {
        await PendingMessage.destroy({
            where: {
                status: 'completed',
                completedAt: {
                    [Op.lt]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
                }
            }
        });

        res.json({
            success: true,
            message: 'Completed messages cleaned up successfully'
        });
    } catch (error) {
        console.error('Error cleaning up completed messages:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to clean up completed messages'
        });
    }
});

// Get messages by status
router.get('/status/:status', async (req, res) => {
    try {
        const messages = await PendingMessage.findAll({
            where: {
                status: req.params.status
            },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Error fetching messages by status:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch messages'
        });
    }
});

module.exports = router;
