const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Delete existing database file if it exists
const dbPath = path.join(__dirname, '../../database.sqlite');
try {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('Existing database file deleted');
    }
} catch (error) {
    console.error('Error deleting database file:', error);
}

// Create SQLite database connection
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

// Test database connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
}

// Initialize database
async function initDatabase() {
    try {
        // Force sync all models
        await sequelize.sync({ force: true });
        console.log('Database synchronized successfully.');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

// Export the sequelize instance directly
module.exports = sequelize;
module.exports.testConnection = testConnection;
module.exports.initDatabase = initDatabase;
