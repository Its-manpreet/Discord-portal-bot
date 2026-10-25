const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField, WebhookClient } = require("discord.js");
const { removeLink, removeWebhook, removeStickyMessage, getStickyMessage, getTargets, getWebhook, getRandomAllowedChannel } = require("../../helpers/dbHandler.js");

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("unlink")
		.setDescription("Unlink two channels")
		.addChannelOption((o) => o.setName("first").setDescription("First channel").addChannelTypes(ChannelType.GuildText).setRequired(false))
		.addChannelOption((o) => o.setName("second").setDescription("Second channel").addChannelTypes(ChannelType.GuildText).setRequired(false)),

	async execute(interaction) {
		let a = interaction.options.getChannel("first");
		let b = interaction.options.getChannel("second");

		if (!a && !b) {
			a = interaction.channel;
			const targetId = getTargets(a.id)?.values().next().value;

			if (targetId) {
				b = await interaction.client.channels.fetch(targetId);
			} else {
				return interaction.reply({ content: "This channel isn't linked to another channel!", flags: MessageFlags.Ephemeral });
			}
		}

		if (!a && b) {
			const targetId = getTargets(b.id)?.values().next().value;

			if (targetId) {
				a = await interaction.client.channels.fetch(targetId);
			} else {
				return interaction.reply({ content: "The specified channel isn't linked to another channel!", flags: MessageFlags.Ephemeral });
			}
		}

		if (a && !b) {
			const targetId = getTargets(a.id)?.values().next().value;

			if (targetId) {
				b = await interaction.client.channels.fetch(targetId);
			} else {
				return interaction.reply({ content: "The specified channel isn't linked to another channel!", flags: MessageFlags.Ephemeral });
			}
		}

		if (a.id === b.id) {
			return interaction.reply({
				content: "Pick two different channels.",
				flags: MessageFlags.Ephemeral,
			});
		}

		if (!getRandomAllowedChannel(a.id) || !getRandomAllowedChannel(b.id)) {
			if (interaction.member.permissions.has([PermissionsBitField.Flags.ManageWebhooks, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels]) === false) {
				return interaction.reply({
					content: "You need the `Manage Webhooks`, `Manage Messages`, and `Manage Channels` permissions to use this command.",
					flags: MessageFlags.Ephemeral,
				});
			}
		}
		await interaction.deferReply({});

		if (!getTargets(a.id)?.has(b.id)) {
			return interaction.editReply(`The channels ${a} and ${b} are not linked.`);
		}

		removeLink(a.id, b.id);

		const webhookA = getWebhook(a.id);
		const webhookAClient = new WebhookClient({
			id: webhookA.webhookId,
			token: webhookA.webhookToken,
		});
		webhookAClient.delete().catch(console.error);
		const webhookB = getWebhook(b.id);
		const webhookBClient = new WebhookClient({
			id: webhookB.webhookId,
			token: webhookB.webhookToken,
		});
		webhookBClient.delete().catch(console.error);
		removeWebhook(a.id);
		removeWebhook(b.id);

		const stickyMessageIdA = getStickyMessage(a.id);
		if (stickyMessageIdA) {
			await a.messages
				.fetch(stickyMessageIdA)
				.then((msg) => msg.edit(`This channel is no longer linked to another channel.`))
				.catch(console.error);
			removeStickyMessage(a.id);
		}

		const stickyMessageIdB = getStickyMessage(b.id);
		if (stickyMessageIdB) {
			await b.messages
				.fetch(stickyMessageIdB)
				.then((msg) => msg.edit(`This channel is no longer linked to another channel.`))
				.catch(console.error);
			removeStickyMessage(b.id);
		}

		await interaction.editReply(`Unlinked ${a} ↔ ${b}`);
	},
};
