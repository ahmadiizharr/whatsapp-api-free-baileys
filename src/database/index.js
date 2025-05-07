const { Sequelize } = require('sequelize');

// Create PostgreSQL database connection
const sequelize = new Sequelize('postgresql://postgres:AyamKampus98!@db.tazsyvwtubhvpmslrncm.supabase.co:5432/postgres', {
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
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
