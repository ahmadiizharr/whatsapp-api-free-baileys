const Autoreply = require('../models/autoreply');

async function seedAutoreplies() {
    try {
        // Clear existing autoreplies
        await Autoreply.destroy({ where: {} });
        console.log('Cleared existing autoreplies');

        // Create test autoreplies
        const autoreplies = await Autoreply.bulkCreate([
            {
                trigger: 'hi',
                response: 'Hello! How can I help you today?',
                isActive: true,
                isExactMatch: false
            },
            {
                trigger: 'wad',
                response: 'Hey there! I see you typed "wad". Did you mean "what"?',
                isActive: true,
                isExactMatch: true
            },
            {
                trigger: 'test',
                response: 'This is a test response. The system is working!',
                isActive: true,
                isExactMatch: false
            },
            {
                trigger: '!ping',
                response: 'PONG!!!!',
                isActive: true,
                isExactMatch: true
            }
        ]);

        console.log('Created test autoreplies:', autoreplies.length);
        console.log('Test autoreplies seeded successfully');
        
        return autoreplies;
    } catch (error) {
        console.error('Error seeding autoreplies:', error);
        throw error;
    }
}

module.exports = {
    seedAutoreplies
};
