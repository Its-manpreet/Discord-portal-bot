const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	cooldown: 5,
	data: new SlashCommandBuilder().setName("help").setDescription("Replies with a list of available commands."),
	async execute(interaction) {
		await interaction.reply(`
            run \`/help\` to get a list of available commands.
            run \`/ping\` to check if the bot is online.
            run \`/invite\` to get an invite link for the bot.
            run \`/link\` to request to link two channels together.
            run \`/unlink\` to unlink two channels.
            run \`/allow\` to allow the current channel to be linked.
            run \`/deny\` to deny the current channel from being linked.
            run \`/allow-random\` to allow the current channel to be linked with random channels. (rerun to disable)
            run \`/random\` to find a random channel to link with. (rerun to exist queue)
            `);
	},
};
