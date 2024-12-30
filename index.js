
const { default: makeWASocket, useMultiFileAuthState } = require('@adiwajshing/baileys');
const express = require('express');
const { rmSync } = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON
app.use(express.json());

// Session management
const startWhatsAppBot = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const sock = makeWASocket({
    auth: state,
  });

  // Save credentials whenever they update
  sock.ev.on('creds.update', saveCreds);

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

// Start the WhatsApp bot
startWhatsAppBot().catch(console.error);

// Start the Express server
app.listen(PORT, () => {
  console.log(`API is running on port ${PORT}`);
});
