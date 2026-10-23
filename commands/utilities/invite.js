const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder().setName("invite").setDescription("Gives the invite link for the bot"),
	async execute(interaction) {
		await interaction.reply(`https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=6865492941074256&scope=bot+applications.commands`);
	},
};
