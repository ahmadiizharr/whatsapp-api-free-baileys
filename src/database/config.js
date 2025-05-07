const sequelize = require('./index');
const { seedAutoreplies } = require('./seedData');

// Initialize database with force sync and seed data
async function initDatabase() {
    try {
        // Test connection first
        await sequelize.testConnection();

        // Force sync all models
        await sequelize.sync({ force: true });
        console.log('Database synchronized successfully.');

        // Seed test data
        await seedAutoreplies();
        console.log('Database seeded with test data.');
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    initDatabase
};
