const express = require('express');
const router = express.Router();
const Autoreply = require('../models/autoreply');

// Get all autoreplies
router.get('/', async (req, res) => {
    try {
        const autoreplies = await Autoreply.findAll();
        res.json({
            success: true,
            data: autoreplies
        });
    } catch (error) {
        console.error('Error fetching autoreplies:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch autoreplies'
        });
    }
});

// Create new autoreply
router.post('/', async (req, res) => {
    try {
        const { trigger, response, isExactMatch = false } = req.body;

        if (!trigger || !response) {
            return res.status(400).json({
                success: false,
                message: 'Trigger and response are required'
            });
        }

        const autoreply = await Autoreply.create({
            trigger,
            response,
            isExactMatch,
            isActive: true
        });

        console.log('Created new autoreply:', autoreply.toJSON());

        res.status(201).json({
            success: true,
            message: 'Autoreply created successfully',
            data: autoreply
        });
    } catch (error) {
        console.error('Error creating autoreply:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create autoreply'
        });
    }
});

// Update autoreply
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { trigger, response, isExactMatch, isActive } = req.body;

        const autoreply = await Autoreply.findByPk(id);
        if (!autoreply) {
            return res.status(404).json({
                success: false,
                message: 'Autoreply not found'
            });
        }

        await autoreply.update({
            trigger: trigger || autoreply.trigger,
            response: response || autoreply.response,
            isExactMatch: isExactMatch !== undefined ? isExactMatch : autoreply.isExactMatch,
            isActive: isActive !== undefined ? isActive : autoreply.isActive
        });

        console.log('Updated autoreply:', autoreply.toJSON());

        res.json({
            success: true,
            message: 'Autoreply updated successfully',
            data: autoreply
        });
    } catch (error) {
        console.error('Error updating autoreply:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update autoreply'
        });
    }
});

// Delete autoreply
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const autoreply = await Autoreply.findByPk(id);
        if (!autoreply) {
            return res.status(404).json({
                success: false,
                message: 'Autoreply not found'
            });
        }

        await autoreply.destroy();

        res.json({
            success: true,
            message: 'Autoreply deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting autoreply:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to delete autoreply'
        });
    }
});

module.exports = router;
