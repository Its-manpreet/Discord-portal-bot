const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField } = require("discord.js");
const { addLink, addWebhook, setStickyMessage, setLinkPending,
		getRandomAllowedChannel, getLookingForRandom, setLookingForRandom, removeLookingForRandom } = require("../../helpers/dbHandler.js");

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
			const queue = getLookingForRandom();
			let alreadyInQueue = false;
			let targetChannelId = null;

			for (const id of queue) {
				if (id === channel.id) {
					alreadyInQueue = true;
					break;
				}
				if (!targetChannelId) {
					targetChannelId = id
				}
			}

			if (alreadyInQueue) {
				removeLookingForRandom(channel.id);
				return await interaction.editReply({
					content: "This channel is no longer looking for a random channel to link with.",
					flags: MessageFlags.Ephemeral,
				});
			}

			if (targetChannelId) {
				const a = channel;
				const b = interaction.client.channels.cache.get(targetChannelId);
				if (!b) {
					removeLookingForRandom(targetChannelId);
					return await interaction.editReply({
						content: "There was an error linking to the random channel. Please try again.",
						flags: MessageFlags.Ephemeral,
					});
				}
				const webhookA = await a
					.createWebhook({
						name: "portal-webhook",
					})
					.catch(console.error);
				const webhookB = await b
					.createWebhook({
						name: "portal-webhook",
					})
					.catch(console.error);

				if (!webhookA || !webhookB) {
					return interaction.editReply({
						content: "An error occurred while creating webhooks. Does the bot have permission to create webhooks in both channels?",
						flags: MessageFlags.Ephemeral,
					});
				}

				addWebhook(a.id, webhookA.id, webhookA.token);
				addWebhook(b.id, webhookB.id, webhookB.token);
				addLink(a.id, b.id);

				const stickyA = await a.send(`This channel is linked to another channel (<#${b.id}>). To unlink, use the \`/unlink\` command.`);
				const stickyB = await b.send(`This channel is linked to another channel (<#${a.id}>). To unlink, use the \`/unlink\` command.`);
				setStickyMessage(a.id, stickyA.id);
				setStickyMessage(b.id, stickyB.id);
				removeLookingForRandom(a.id);
				removeLookingForRandom(b.id);

				await interaction.editReply(`Linked ${a} to a random channel`);
			} else {
				setLookingForRandom(channel.id);
				await interaction.editReply(`This channel is now looking for a random channel to link with. Please wait for another channel to use the \`/random\` command.`);
			}
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "An error occurred while linking the channels. Does the bot have permission to create webhooks in both channels?",
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
