const { Events, MessageFlags, WebhookClient } = require("discord.js");
const db = require("../helpers/dbHandler.js");

const ownerId = process.env.OWNER_ID;

function restickStickyMessage(channel, stickyMessageId, linkedChannelID) {
	if (stickyMessageId) {
		channel.messages.delete(stickyMessageId).catch(console.error);
		channel
			.send(`This channel is linked to another channel (<#${linkedChannelID}>). To unlink, use the \`/unlink\` command.`)
			.then((stickyMessage) => {
				db.setStickyMessage(channel.id, stickyMessage.id);
			})
			.catch(console.error);
	}
}

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot) return;
		
		if (message.author.id === ownerId && message.content.startsWith("!!ban")) {
			db.addBannedUser(message.content.split(" ")[1], message.content.split(" ").slice(2).join(" "), null);
			message.channel.send(`User <@${message.content.split(" ")[1]}> has been banned from using the bot.`);
			return;
		}

		if (db.getBannedUser(message.author.id)) return;

		const targets = db.getTargets(message.channelId);
		if (!targets) return;

		for (const targetId of targets) {
			const channel = message.client.channels.cache.get(targetId);



			if (!channel) continue;

			restickStickyMessage(message.channel, db.getStickyMessage(message.channelId), channel.id);

			const webhook = db.getWebhook(targetId);
			if (webhook) {
				const webhookClient = new WebhookClient({
					id: webhook.webhookId,
					token: webhook.webhookToken,
				});
				let messageToSend = '';
				if (message.reference && message.reference.messageId) {
					try {
						const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
						if (referencedMessage) {
							messageToSend += `-# ↱ **${referencedMessage.author.username}**: ${referencedMessage.content}\n`;
						}

					} catch (error) {
						// If the referenced message cannot be fetched, we can ignore it and send the message without a reference.
					}
				}
				messageToSend += message.content;
				const webhookMessage = await webhookClient.send({
					content: messageToSend,
					username: message.author.username,
					avatarURL: message.author.displayAvatarURL(),
					flags: MessageFlags.SuppressEmbeds,
					allowedMentions: { parse: ["users"] },
				});

				db.addMessageToWebhookMap(message.id, webhook.webhookId, webhook.webhookToken, channel.id, webhookMessage.id);
			} else {
				await channel.send(`**${message.author.username}**: ${message.content}`);
			}

			restickStickyMessage(channel, db.getStickyMessage(targetId), message.channel.id);
		}
	},
};
