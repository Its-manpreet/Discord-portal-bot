const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

const helperchannel = process.env.REPORT_CHANNEL_ID;

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder()
		.setName("report")
		.setDescription("Submit a report about a user to the bot owner")
		.addStringOption((o) => o.setName("description").setDescription("Description of the issue").setRequired(true))
		.addAttachmentOption((o) => o.setName("screenshot").setDescription("Screenshot of the issue").setRequired(false))
		.addMentionableOption((o) => o.setName("user").setDescription("User to report").setRequired(false))
		.addChannelOption((o) => o.setName("channel").setDescription("Channel to report").setRequired(false)),
	async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

		const description = interaction.options.getString("description");
		const screenshot = interaction.options.getAttachment("screenshot");
		const reportedUser = interaction.options.getMentionable("user");
		const reportedChannel = interaction.options.getChannel("channel");
		const reportChannel = await interaction.client.channels.fetch(helperchannel);

		const reportEmbed = new EmbedBuilder()
			.setTitle("New Report")
			.setDescription(description)
			.setColor(0xff0000)
			.setTimestamp()
			.addFields(
				{ name: "Reported by", value: `${interaction.user.tag} (${interaction.user.id})` },
				{ name: "Server", value: interaction.guild ? `${interaction.guild.name} (${interaction.guild.id})` : "Direct message" },
				{ name: "Reported user", value: reportedUser ? `${reportedUser} (${reportedUser.id})` : "Not provided" },
				{ name: "Reported channel", value: reportedChannel ? `${reportedChannel} (${reportedChannel.id})` : "Not provided" },
			);

		if (screenshot) {
			reportEmbed.setImage(screenshot.url);
		}

		await reportChannel.send({
			embeds: [reportEmbed],
			files: screenshot ? [{ attachment: screenshot.url, name: screenshot.name || "screenshot" }] : [],
		});

        await interaction.editReply({ content: "Your report has been submitted to the bot owner." });
	},
};
