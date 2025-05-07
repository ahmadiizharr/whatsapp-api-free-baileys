const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Autoreply = sequelize.define('Autoreply', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    trigger: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    response: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    isExactMatch: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'autoreply_rules',
    indexes: [
        {
            fields: ['trigger']
        },
        {
            fields: ['isActive']
        }
    ]
});

module.exports = Autoreply;
