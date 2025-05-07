const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const AuthState = sequelize.define('AuthState', {
    key: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    timestamps: true
});

module.exports = AuthState;
