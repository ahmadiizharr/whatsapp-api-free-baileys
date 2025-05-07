const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Webhook = sequelize.define('Webhook', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    events: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: ['message', 'status']
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    secret: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastTrigger: {
        type: DataTypes.DATE,
        allowNull: true
    },
    failureCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

module.exports = Webhook;
