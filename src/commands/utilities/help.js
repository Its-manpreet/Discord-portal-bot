const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
      cooldown: 5,
	data: new SlashCommandBuilder().setName("help").setDescription("Replies with a list of available commands."),
	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setColor(0x0099ff)
			.setTitle("Command List")
			.setDescription(`
1. **/link** - Link two channels together.
2. **/unlink** - Unlink two channels.
3. **/allow** - Allow a channel to be linked with another channel.
4. **/deny** - Deny a link request from another channel.
5. **/allow-random** - Allow a channel to be linked with random channels (rerun to disable).
6. **/random** - Link the current channel with a random allowed channel (rerun to exit queue).
7. **/links** - List all the channels linked in this server.
8. **/invite** - Get the invite link for the bot.
9. **/help** - Show this help message.
10. **/ping** - Check the bot's latency.
                        `)
			.setFooter({ text: "Earcups" });

		await interaction.reply({ embeds: [embed] });
	},
};
