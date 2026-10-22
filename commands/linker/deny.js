const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField } = require("discord.js");
const { addLink, addWebhook, setStickyMessage, getLinkPending, removeLinkPending } = require("../../dbHandler.js");

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("deny")
    .setDescription("Denies the channel from being linked with other channels"),

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
                removeLinkPending(channel.id);
                removeLinkPending(b.id);
                await b.send(`The channel <#${a.id}> has denied the link request.`);
                await interaction.editReply(`Denied link ${a} ↔ ${b}`);
            } else {
                await interaction.editReply({
                    content: "There is no pending link request for this channel.",
                    flags: MessageFlags.Ephemeral,
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: "An error occurred while denying the link. Does the bot have permission to create webhooks in both channels?",
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}