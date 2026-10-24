const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField } = require("discord.js");
const { getTargets, getRandomAllowedChannel } = require("../../helpers/dbHandler.js");

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
			let replyContent = "";
			if (linkedChannels.length === 0) {
				replyContent += "There are no linked channels in this server.\n";
			} else {
				replyContent += "## Linked channels:\n";
				for (const { channel, targets } of linkedChannels) {
					replyContent += `${channel} ↔ <#${targets.values().join(", ")}>\n`;
				}
				replyContent += "\nTo unlink channels, use the `/unlink` command.";
				replyContent += "\n";
			}
			let randomLinkableChannels = [];
			for (const channel of allChannels.values()) {
				const randomChannel = getRandomAllowedChannel(channel.id);
				if (randomChannel) {
					randomLinkableChannels.push(channel);
				}
			}
			if (randomLinkableChannels.length === 0) {
				replyContent += "There are no channels allowed to be linked with random channels.";
			} else {
				replyContent += "## Randomly linkable channels:\n";
				for (const channel of randomLinkableChannels) {
					replyContent += `${channel}\n`;
				}
				replyContent += "\nTo disallow a channel to be linked with random channels, use the `/allow-random` command again.";
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
