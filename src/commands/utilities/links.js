const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField, EmbedBuilder } = require("discord.js");
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
			const embed = new EmbedBuilder()
				.setTitle("Channel links")
				.setColor(0x5865f2);
			if (linkedChannels.length === 0) {
				embed.addFields({
					name: "Linked channels",
					value: "There are no linked channels in this server.",
				});
			} else {
				const linkedChannelLines = [];
				for (const { channel, targets } of linkedChannels) {
					linkedChannelLines.push(
						`${channel} ↔ ${Array.from(targets.values()).map((target) => `<#${target}>`).join(", ")}`,
					);
				}
				embed.addFields({
					name: "Linked channels",
					value: `${linkedChannelLines.join("\n")}\n\nTo unlink channels, use the \`/unlink\` command.`,
				});
			}
			let randomLinkableChannels = [];
			for (const channel of allChannels.values()) {
				const randomChannel = getRandomAllowedChannel(channel.id);
				if (randomChannel) {
					randomLinkableChannels.push(channel);
				}
			}
			if (randomLinkableChannels.length === 0) {
				embed.addFields({
					name: "Randomly linkable channels",
					value: "There are no channels allowed to be linked with random channels.",
				});
			} else {
				embed.addFields({
					name: "Randomly linkable channels",
					value: `${randomLinkableChannels.join("\n")}\n\nTo disallow a channel to be linked with random channels, use the \`/allow-random\` command again.`,
				});
			}
			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "An error occurred while fetching the links.",
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
