const Slimbot = require('slimbot');
const slimbot = new Slimbot('626227083:AAGIC2lVQRnFkKN7RoD0JySSI7q_5fkbce4');

'820663765'

// Register listeners
slimbot.on('message', message => {
  // reply when user sends a message
  console.log(message);
  slimbot.sendMessage(message.chat.id, 'Message received');
});

// Call API
slimbot.startPolling();
