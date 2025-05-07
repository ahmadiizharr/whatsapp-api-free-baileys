const makeWASocket = require('@whiskeysockets/baileys').default;
const { DisconnectReason, delay } = require('@whiskeysockets/baileys');
const { useDBAuthState } = require('./authStateHandler');
const PendingMessage = require('../models/pendingMessage');
const Autoreply = require('../models/autoreply');
const { Op } = require('sequelize');

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.qr = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000;
        this.messageRetryCount = 3;
        this.messageRetryDelay = 2000;
        this.isReconnecting = false;
        this.isInitializing = false;
    }

    async initialize() {
        if (this.isInitializing) {
            console.log('WhatsApp service is already initializing...');
            return;
        }

        if (this.isConnected && this.sock) {
            console.log('WhatsApp service is already connected.');
            return;
        }

        this.isInitializing = true;

        try {
            console.log('Initializing WhatsApp connection...');
            const { state, saveCreds, clearState } = await useDBAuthState();
            
            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: true,
                browser: ['WhatsApp API', 'Chrome', '1.0.0'],
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 30000,
                keepAliveIntervalMs: 10000,
                emitOwnEvents: true,
                markOnlineOnConnect: true,
                syncFullHistory: false,
                retryRequestDelayMs: 2000,
                fireInitQueries: true,
                generateHighQualityLinkPreview: false,
                shouldIgnoreJid: () => false,
                waitForChats: false,
                waitOnlyForLastMessage: false
            });

            console.log('Using Baileys version:', require('@whiskeysockets/baileys/package.json').version);

            // Handle connection updates
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                console.log('Connection update:', update);

                if (qr) {
                    console.log('New QR code received');
                    this.qr = qr;
                    this.reconnectAttempts = 0;
                }

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut && 
                                         statusCode !== DisconnectReason.connectionClosed;
                    console.log('Connection closed. Status code:', statusCode);
                    
                    if (!this.isReconnecting && shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.isReconnecting = true;
                        console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
                        this.reconnectAttempts++;
                        
                        if (this.sock) {
                            this.sock.end();
                            this.sock = null;
                        }

                        await delay(this.reconnectDelay);
                        
                        try {
                            this.isInitializing = false;
                            await this.initialize();
                        } catch (error) {
                            console.error('Reconnection attempt failed:', error);
                        }
                        
                        this.isReconnecting = false;
                    } else if (!shouldReconnect || this.reconnectAttempts >= this.maxReconnectAttempts) {
                        console.log('Session ended or max reconnection attempts reached. Clearing session...');
                        await this.deleteSession();
                        this.reconnectAttempts = 0;
                        this.isReconnecting = false;
                    }
                    
                    this.isConnected = false;
                } else if (connection === 'open') {
                    console.log('Connection opened successfully');
                    this.isConnected = true;
                    this.qr = null;
                    this.reconnectAttempts = 0;
                    this.isReconnecting = false;
                }
            });

            // Save credentials whenever updated
            this.sock.ev.on('creds.update', saveCreds);

            // Handle incoming messages
            this.sock.ev.on('messages.upsert', async (m) => {
                if (m.type === 'notify') {
                    for (const msg of m.messages) {
                        if (!msg.key.fromMe) {
                            try {
                                // Mark message as read
                                await this.markMessageAsRead(msg);
                                
                                // Handle the message
                                await this.handleIncomingMessage(msg);
                            } catch (error) {
                                console.error('Error processing incoming message:', error);
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error initializing WhatsApp:', error);
            this.isReconnecting = false;
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    async markMessageAsRead(msg) {
        try {
            const key = {
                remoteJid: msg.key.remoteJid,
                id: msg.key.id,
                participant: msg.key.participant
            };

            // Add small delay before marking as read
            await delay(1000);
            
            await this.sock.readMessages([key]);
            console.log('Marked message as read:', key.id);
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    }

    async handleIncomingMessage(msg) {
        try {
            if (!msg.message || !this.isConnected) return;

            const messageText = msg.message.conversation || 
                              msg.message.extendedTextMessage?.text ||
                              msg.message.imageMessage?.caption;

            if (!messageText) return;

            console.log('Received message:', messageText);

            try {
                // Check for autoreply triggers
                const autoreplies = await Autoreply.findAll({
                    where: { isActive: true }
                });

                console.log('Found active autoreplies:', autoreplies.length);

                for (const autoreply of autoreplies) {
                    console.log('Checking trigger:', autoreply.trigger);
                    
                    const matches = autoreply.isExactMatch 
                        ? messageText.toLowerCase() === autoreply.trigger.toLowerCase()
                        : messageText.toLowerCase().includes(autoreply.trigger.toLowerCase());

                    if (matches) {
                        console.log('Autoreply match found for trigger:', autoreply.trigger);
                        console.log('Sending response:', autoreply.response);
                        
                        // Add delay before sending autoreply
                        await delay(2000);
                        
                        try {
                            // Format the message properly
                            const formattedMessage = {
                                text: autoreply.response
                            };

                            await this.sock.sendMessage(msg.key.remoteJid, formattedMessage);
                            console.log('Autoreply sent successfully');
                            break;
                        } catch (error) {
                            console.error('Error sending autoreply:', error);
                            
                            // Try reconnecting if there's a connection issue
                            if (error.output?.statusCode === 500) {
                                console.log('Connection issue detected, attempting to reconnect...');
                                await this.initialize();
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error processing autoreply:', error);
            }
        } catch (error) {
            console.error('Error handling incoming message:', error);
        }
    }

    async sendMessage(to, message) {
        try {
            if (!this.isConnected) {
                throw new Error('WhatsApp is not connected');
            }

            const jid = to.includes('@g.us') ? to : `${to}@s.whatsapp.net`;
            
            // Format the message properly
            const formattedMessage = {
                text: message.trim()
            };

            await delay(2000);
            
            const result = await this.sock.sendMessage(jid, formattedMessage);
            console.log('Message sent successfully:', { to, messageId: result.key.id });

            return { success: true, message: 'Message sent successfully' };
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    getConnectionStatus() {
        return {
            success: true,
            isConnected: this.isConnected,
            qr: this.qr
        };
    }

    async deleteSession() {
        try {
            if (this.sock) {
                this.sock.end();
                this.sock = null;
            }
            
            const { clearState } = await useDBAuthState();
            await clearState();
            
            this.isConnected = false;
            this.qr = null;
            this.reconnectAttempts = 0;
            this.isReconnecting = false;
            this.isInitializing = false;
            
            console.log('Session deleted successfully');
            return { success: true, message: 'Session deleted successfully' };
        } catch (error) {
            console.error('Error deleting session:', error);
            throw error;
        }
    }
}

// Create singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;
