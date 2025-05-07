const express = require('express');
const router = express.Router();
const Webhook = require('../models/webhook');
const crypto = require('crypto');

// Get all webhooks
router.get('/', async (req, res) => {
    try {
        const webhooks = await Webhook.findAll({
            order: [['createdAt', 'DESC']]
        });
        
        res.json({
            success: true,
            data: webhooks
        });
    } catch (error) {
        console.error('Error fetching webhooks:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch webhooks'
        });
    }
});

// Create new webhook
router.post('/', async (req, res) => {
    try {
        const { name, url, events = ['message', 'status'], secret } = req.body;

        if (!name || !url) {
            return res.status(400).json({
                success: false,
                message: 'Name and URL are required'
            });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Invalid URL format'
            });
        }

        // Generate random secret if not provided
        const webhookSecret = secret || crypto.randomBytes(32).toString('hex');

        const webhook = await Webhook.create({
            name,
            url,
            events: Array.isArray(events) ? events : ['message', 'status'],
            secret: webhookSecret,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: 'Webhook created successfully',
            data: webhook
        });
    } catch (error) {
        console.error('Error creating webhook:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create webhook'
        });
    }
});

// Update webhook
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, url, events, isActive, secret } = req.body;

        const webhook = await Webhook.findByPk(id);
        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        // Validate URL if provided
        if (url) {
            try {
                new URL(url);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid URL format'
                });
            }
        }

        await webhook.update({
            name: name || webhook.name,
            url: url || webhook.url,
            events: Array.isArray(events) ? events : webhook.events,
            isActive: isActive !== undefined ? isActive : webhook.isActive,
            secret: secret || webhook.secret
        });

        res.json({
            success: true,
            message: 'Webhook updated successfully',
            data: webhook
        });
    } catch (error) {
        console.error('Error updating webhook:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update webhook'
        });
    }
});

// Delete webhook
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const webhook = await Webhook.findByPk(id);
        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        await webhook.destroy();

        res.json({
            success: true,
            message: 'Webhook deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting webhook:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete webhook'
        });
    }
});

// Test webhook
router.post('/:id/test', async (req, res) => {
    try {
        const { id } = req.params;

        const webhook = await Webhook.findByPk(id);
        if (!webhook) {
            return res.status(404).json({
                success: false,
                message: 'Webhook not found'
            });
        }

        // Create test payload
        const testPayload = {
            type: 'test',
            timestamp: new Date().toISOString(),
            webhook_id: webhook.id,
            message: 'This is a test webhook notification'
        };

        // Generate signature
        const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(JSON.stringify(testPayload))
            .digest('hex');

        // Send test request
        const axios = require('axios');
        const response = await axios.post(webhook.url, testPayload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature
            },
            timeout: 5000 // 5 second timeout
        });

        if (response.status >= 200 && response.status < 300) {
            await webhook.update({
                lastTrigger: new Date(),
                failureCount: 0
            });

            res.json({
                success: true,
                message: 'Webhook test completed successfully',
                response: {
                    status: response.status,
                    data: response.data
                }
            });
        } else {
            throw new Error(`Webhook responded with status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error testing webhook:', error);
        
        // Update failure count if webhook exists
        if (req.webhook) {
            await req.webhook.increment('failureCount');
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to test webhook'
        });
    }
});

module.exports = router;
