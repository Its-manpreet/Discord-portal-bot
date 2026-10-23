const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField, WebhookClient } = require("discord.js");
const { addRandomAllowedChannel, getRandomAllowedChannel, removeRandomAllowedChannel,
		addWebhook, removeWebhook, getWebhook } = require("../../helpers/dbHandler.js");

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName("allow-random")
		.setDescription("Allows the channel to be linked with random channels")
		.addChannelOption((o) => o.setName("channel").setDescription("First channel").addChannelTypes(ChannelType.GuildText).setRequired(false))
		.addNumberOption((o) => o.setName("age-limit").setDescription("Age limit for the channel").setRequired(false).addChoices(
			{ name: "13+", value: 13 },
			{ name: "16+", value: 16 },
			{ name: "18+", value: 18 }
		)),

	async execute(interaction) {
		const channel = interaction.options.getChannel("Channel") || interaction.channel;

		if (interaction.member.permissions.has([PermissionsBitField.Flags.ManageWebhooks, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels]) === false) {
			return interaction.reply({
				content: "You need the `Manage Webhooks`, `Manage Messages`, and `Manage Channels` permissions to use this command.",
				flags: MessageFlags.Ephemeral,
			});
		}
		if (interaction.guild.members.me.permissions.has([PermissionsBitField.Flags.ManageWebhooks, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels]) === false) {
			return interaction.reply({
				content: "I need the `Manage Webhooks`, `Manage Messages`, and `Manage Channels` permissions to link channels.",
				flags: MessageFlags.Ephemeral,
			});
		}
		if (!channel.viewable) {
			return interaction.reply({
				content: "I need the `View Channel` permission in the channel to link it.",
				flags: MessageFlags.Ephemeral,
			});
		}

		try {
			await interaction.deferReply({});

			if (getRandomAllowedChannel(channel.id)) {
				removeRandomAllowedChannel(channel.id);
				const webhook = getWebhook(channel.id);
				if (webhook) {
					const webhookClient = new WebhookClient({
						id: webhook.webhookId,
						token: webhook.webhookToken,
					});
					webhookClient.delete().catch(console.error);
					removeWebhook(channel.id);
				}
				await interaction.editReply(`The channel <#${channel.id}> is now disallowed to be linked with random channels.`);
			} else {
				addRandomAllowedChannel(channel.id, { age_limit: interaction.options.getNumber("age-limit") || 0 });
				const webhook = await channel.createWebhook({
					name: "portal-webhook",
				}).catch(console.error);
				addWebhook(channel.id, webhook.id, webhook.token);
				await interaction.editReply(`The channel <#${channel.id}> is now allowed to be linked with random channels.`);
			}

		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "An error occurred while allowing the channel to be linked with random channels. Does the bot have appropriate permissions in the channel?",
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
