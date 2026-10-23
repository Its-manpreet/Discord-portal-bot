const { Events, MessageFlags, WebhookClient } = require("discord.js");
const { getTargets, getWebhook, getStickyMessage, setStickyMessage, addMessageToWebhookMap } = require("../helpers/dbHandler.js");

function restickStickyMessage(channel, stickyMessageId, linkedChannelID) {
	if (stickyMessageId) {
		channel.messages.delete(stickyMessageId).catch(console.error);
		channel
			.send(`This channel is linked to another channel (<#${linkedChannelID}>). To unlink, use the \`/unlink\` command.`)
			.then((stickyMessage) => {
				setStickyMessage(channel.id, stickyMessage.id);
			})
			.catch(console.error);
	}
}

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot) return;

		const targets = getTargets(message.channelId);
		if (!targets) return;

		for (const targetId of targets) {
			const channel = message.client.channels.cache.get(targetId);
			if (!channel) continue;

			restickStickyMessage(message.channel, getStickyMessage(message.channelId), channel.id);

			const webhook = getWebhook(targetId);
			if (webhook) {
				const webhookClient = new WebhookClient({
					id: webhook.webhookId,
					token: webhook.webhookToken,
				});
				const webhookMessage = await webhookClient.send({
					content: message.content,
					username: message.author.username,
					avatarURL: message.author.displayAvatarURL(),
					flags: MessageFlags.SuppressEmbeds,
					allowedMentions: { parse: ["users"] },
				});

				addMessageToWebhookMap(message.id, webhook.webhookId, webhook.webhookToken, channel.id, webhookMessage.id);
			} else {
				await channel.send(`**${message.author.username}**: ${message.content}`);
			}

			restickStickyMessage(channel, getStickyMessage(targetId), message.channel.id);
		}
	},
};
