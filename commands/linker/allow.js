const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField } = require("discord.js");
const { addLink, addWebhook, setStickyMessage, getLinkPending, removeLinkPending } = require("../../dbHandler.js");

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("allow")
    .setDescription("Allows the channel to be linked with other channels"),

  async execute(interaction) {
      if (interaction.member.permissions.has([PermissionsBitField.Flags.ManageWebhooks, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels]) === false) {
          return interaction.reply({
              content: "You need the `Manage Webhooks`, `Manage Messages`, and `Manage Channels` permissions to use this command.",
              flags: MessageFlags.Ephemeral,
            });
        }
        if (interaction.guild.members.me.permissions.has([PermissionsBitField.Flags.ManageWebhooks, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels]) === false) {
            return interaction.reply({
                content: "I need the `Manage Webhooks`, `Manage Messages`, and `Manage Channels` permissions to link channels.",
                flags: MessageFlags.Ephemeral,
            });
        }
        
        const channel = interaction.channel;

        if (!channel.viewable) {
            return interaction.reply({
                content: "I need the `View Channel` permission in this channel to link it.",
                flags: MessageFlags.Ephemeral,
            });
        }
        
        try {
            await interaction.deferReply({ });
            const pending = getLinkPending(channel.id);
            if (pending) {
                const a = channel;
                const b = interaction.client.channels.cache.get(pending);
                if (!b) {
                    removeLinkPending(channel.id);
                    return interaction.editReply({
                        content: "The pending link channel is no longer available. Please try again.",
                        flags: MessageFlags.Ephemeral,
                    });
                }
                const bPending = getLinkPending(b.id);
                if (bPending) {
                    if (bPending == a.id) {
                        removeLinkPending(a.id);
                        await interaction.editReply({
                            content: "Kindly also accept the link request in the other channel to complete the linking process.",
                            flags: MessageFlags.Ephemeral,
                        });
                        return;
                    }
                }
                const webhookA = await a.createWebhook({
                    name: "portal-webhook",
                })
                    .catch(console.error);
                const webhookB = await b.createWebhook({
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

                removeLinkPending(channel.id);
                await interaction.editReply(`Linked ${a} ↔ ${b}`);
            } else {
                await interaction.editReply({
                    content: "There is no pending link request for this channel.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: "An error occurred while linking the channels. Does the bot have permission to create webhooks in both channels?",
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}