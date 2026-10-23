const { Events, MessageFlags, WebhookClient } = require("discord.js");
const { getTargets, getWebhook, getMessageFromWebhookMap } = require("../dbHandler.js");

module.exports = {
	name: Events.MessageUpdate,
	async execute(oldMessage, newMessage) {
		const message = newMessage;

		if (message.author.bot) return;

		const targets = getTargets(message.channelId);
		if (!targets) return;

		const { webhookId, webhookToken, targetChannelId, webhookMessageId } = getMessageFromWebhookMap(message.id);
		for (const targetId of targets) {
			const channel = message.client.channels.cache.get(targetId);
			if (!channel) continue;

			if (targetId === targetChannelId) {
				const webhookClient = new WebhookClient({
					id: webhookId,
					token: webhookToken,
				});
				await webhookClient.editMessage(webhookMessageId, {
					content: message.content,
				});
			}
		}
	},
};
