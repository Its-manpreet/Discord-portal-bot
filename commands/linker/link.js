const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField } = require("discord.js");
const { addLink, addWebhook, setStickyMessage } = require("../../dbHandler.js");

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link two channels together")
    .addChannelOption((o) =>
      o
        .setName("first")
        .setDescription("First channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addChannelOption((o) =>
      o
        .setName("second")
        .setDescription("Second channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    ),

  async execute(interaction) {
    const a = interaction.options.getChannel("first");
    const b = interaction.options.getChannel("second");

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
    if (!a.viewable || !b.viewable) {
      return interaction.reply({
        content: "I need the `View Channel` permission in both channels to link them.",
        flags: MessageFlags.Ephemeral,
      });
    }

    if (a.id === b.id) {
      return interaction.reply({
        content: "Pick two different channels.",
        flags: MessageFlags.Ephemeral,
      });
    }
    try {
      await interaction.deferReply({ });

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
      
      stickyA = await a.send(`This channel is linked to another channel (<#${b.id}>). To unlink, use the \`/unlink\` command.`);
      stickyB = await b.send(`This channel is linked to another channel (<#${a.id}>). To unlink, use the \`/unlink\` command.`);
      setStickyMessage(a.id, stickyA.id);
      setStickyMessage(b.id, stickyB.id);

      await interaction.editReply(`Linked ${a} ↔ ${b}`);
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "An error occurred while linking the channels. Does the bot have permission to create webhooks in both channels?",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
