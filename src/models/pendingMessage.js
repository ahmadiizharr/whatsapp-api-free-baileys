const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const PendingMessage = sequelize.define('PendingMessage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    to: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('pending', 'failed', 'sent', 'completed'),
        defaultValue: 'pending',
        allowNull: false
    },
    lastAttempt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    tableName: 'pending_messages',
    indexes: [
        {
            fields: ['status']
        },
        {
            fields: ['createdAt']
        }
    ]
});

module.exports = PendingMessage;
