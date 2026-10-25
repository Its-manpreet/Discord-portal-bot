const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder().setName("ping").setDescription("Returns the bot's latency"),
	async execute(interaction) {
		await interaction.reply("Pong! latency is " + (Date.now() - interaction.createdTimestamp) );
	},
};
