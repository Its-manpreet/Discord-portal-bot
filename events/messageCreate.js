const { Events, MessageFlags,  WebhookClient } = require('discord.js');
const { getTargets, getWebhook } = require('../dbHandler.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const targets = getTargets(message.channelId);
        if (!targets) return;

        for (const targetId of targets) {
        const channel = message.client.channels.cache.get(targetId);
        if (!channel) continue;
        const webhook = getWebhook(targetId);
        if (webhook){
            const webhookClient = new WebhookClient({ id: webhook.webhookId, token: webhook.webhookToken });
            await webhookClient.send({
                content: message.content,
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL(),
                flags: MessageFlags.SuppressEmbeds,
            });
        } else {
            await channel.send(`**${message.author.username}**: ${message.content}`);
        }
        }
    }
}