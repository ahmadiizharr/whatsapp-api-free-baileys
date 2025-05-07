const AuthState = require('../models/authState');

const useDBAuthState = async () => {
    const writeData = async (key, data) => {
        try {
            await AuthState.upsert({
                key,
                value: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error writing auth data:', error);
            throw error;
        }
    };

    const readData = async (key) => {
        try {
            const data = await AuthState.findByPk(key);
            return data ? JSON.parse(data.value) : null;
        } catch (error) {
            console.error('Error reading auth data:', error);
            return null;
        }
    };

    const removeData = async (key) => {
        try {
            await AuthState.destroy({
                where: { key }
            });
        } catch (error) {
            console.error('Error removing auth data:', error);
        }
    };

    const creds = await readData('creds') || { noiseKey: null, signedIdentityKey: null, signedPreKey: null, registrationId: null, advSecretKey: null, nextPreKeyId: null, firstUnuploadedPreKeyId: null, serverHasPreKeys: null, account: null, me: null, signalIdentities: [], lastAccountSyncTimestamp: null, myAppStateKeyId: null };

    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = await readData(`${type}-${ids.join('_')}`);
                    return data ? data.keys : {};
                },
                set: async (type, ids, value) => {
                    await writeData(`${type}-${ids.join('_')}`, { keys: value });
                }
            }
        },
        saveCreds: async () => {
            await writeData('creds', creds);
        },
        clearState: async () => {
            try {
                await AuthState.destroy({
                    where: {},
                    truncate: true
                });
            } catch (error) {
                console.error('Error clearing auth state:', error);
            }
        }
    };
};

module.exports = { useDBAuthState };
