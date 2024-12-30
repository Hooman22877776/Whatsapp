
const { default: makeWASocket, useMultiFileAuthState } = require('@adiwajshing/baileys');
const qrcode = require('qrcode-terminal');
const express = require('express');
const { rmSync } = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON
app.use(express.json());

// Start WhatsApp Bot
const startWhatsAppBot = async () => {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({
        auth: state,
    });

    // Save credentials whenever they update
    sock.ev.on('creds.update', saveCreds);

    // Listen for connection updates and QR codes
    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
            console.log('Scan the QR code above to log in');
        }
        if (connection === 'open') {
            console.log('Connected to WhatsApp');
        }
    });

    // API to send messages
    app.post('/send-message', async (req, res) => {
        const { to, message } = req.body;
        try {
            await sock.sendMessage(`${to}@s.whatsapp.net`, { text: message });
            res.status(200).json({ status: 'success', message: 'Message sent!' });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.toString() });
        }
    });

    // API to logout
    app.post('/logout', (req, res) => {
        try {
            rmSync('./auth_info', { recursive: true, force: true });
            res.status(200).json({ status: 'success', message: 'Logged out!' });
        } catch (error) {
            res.status(500).json({ status: 'error', error: error.toString() });
        }
    });

    // Default route
    app.get('/', (req, res) => {
        res.send('WhatsApp bot is running!');
    });
};

// Start the bot and server
startWhatsAppBot().catch(console.error);
app.listen(PORT, () => {
    console.log(`API is running on port ${PORT}`);
});
