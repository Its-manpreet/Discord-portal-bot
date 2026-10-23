const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField } = require("discord.js");
const { addLink, addWebhook, setStickyMessage, setLinkPending,
		getRandomAllowedChannel, getLookingForRandom, setLookingForRandom, removeLookingForRandom } = require("../../src/helpers/dbHandler.js");

module.exports = {
	cooldown: 10,
	data: new SlashCommandBuilder()
		.setName("random")
		.setDescription("Find a random channel to link with"),

	async execute(interaction) {
		if (interaction.guild.members.me.permissions.has([PermissionsBitField.Flags.ManageWebhooks, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels]) === false) {
			return interaction.reply({
				content: "I need the `Manage Webhooks`, `Manage Messages`, and `Manage Channels` permissions to link channels.",
				flags: MessageFlags.Ephemeral,
			});
		}
		try {
			await interaction.deferReply({});
			const channel = interaction.channel;
			const randomChannel = getRandomAllowedChannel(channel.id);
			if (!randomChannel) {
				return await interaction.editReply({
					content: "This channel is not allowed to be linked with random channels. Please ask a server admin to use the `/allow-random` command in this channel.",
					flags: MessageFlags.Ephemeral,
				});
			}
			const queue = getLookingForRandom(channel.id);
			if (queue.length > 0) {
				const targetChannelId = queue[0];

			}
			// await interaction.editReply(``);
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "An error occurred while linking the channels. Does the bot have permission to create webhooks in both channels?",
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
