const { Events, MessageFlags } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;
        message.channel.send(`You said: ${message.content}`);
    }
}