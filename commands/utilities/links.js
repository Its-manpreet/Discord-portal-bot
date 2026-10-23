const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField } = require("discord.js");
const { getTargets } = require("../../dbHandler.js");

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder().setName("links").setDescription("Lists all the channels linked in this server"),
	async execute(interaction) {
		try {
			await interaction.deferReply({});
			const allChannels = interaction.guild.channels.cache.filter((c) => c.type === ChannelType.GuildText);
			const linkedChannels = [];
			for (const channel of allChannels.values()) {
				const targets = getTargets(channel.id);
				if (targets) {
					linkedChannels.push({ channel, targets });
				}
			}
			if (linkedChannels.length === 0) {
				await interaction.editReply({
					content: "There are no linked channels in this server.",
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
			let replyContent = "Linked channels:\n";
			for (const { channel, targets } of linkedChannels) {
				replyContent += `${channel} ↔ <#${targets.values().join(", ")}>\n`;
			}
			await interaction.editReply(replyContent);
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "An error occurred while fetching the links.",
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
