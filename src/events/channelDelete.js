const { Events, MessageFlags, WebhookClient } = require("discord.js");
const { getTargets, removeLink, removeLinkPending, removeLookingForRandom, removeRandomAllowedChannel, removeStickyMessage, removeWebhook } = require("../helpers/dbHandler.js");

module.exports = {
	name: Events.ChannelDelete,
	async execute(channel) {
		if (channel.guild === null) return;


		const targets = getTargets(channel.id);
		if (!targets) return;

		removeLink(channel.id);
		removeLinkPending(channel.id);
		removeLookingForRandom(channel.id);
		removeRandomAllowedChannel(channel.id);
		removeStickyMessage(channel.id);
		removeWebhook(channel.id);
	},
};
