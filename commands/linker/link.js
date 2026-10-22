const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField } = require("discord.js");
const { addLink, addWebhook, setStickyMessage, setLinkPending } = require("../../dbHandler.js");

module.exports = {
  cooldown: 10,
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

      
      if (a == interaction.channel) {
        setLinkPending(b.id, a.id);
        await b.send(`The channel <#${a.id}> wants to link with this channel. To accept, use the \`/allow\` (to deny use \`/deny\`) command in this channel.`);
      } else if (b == interaction.channel) {
        setLinkPending(a.id, b.id);
        await a.send(`The channel <#${b.id}> wants to link with this channel. To accept, use the \`/allow\` (to deny use \`/deny\`) command in this channel.`);
      }
      else {
        setLinkPending(a.id, b.id);
        setLinkPending(b.id, a.id);
        await a.send(`The channel <#${b.id}> wants to link with this channel. To accept, use the \`/allow\` (to deny use \`/deny\`) command in this channel.`);
        await b.send(`The channel <#${a.id}> wants to link with this channel. To accept, use the \`/allow\` (to deny use \`/deny\`) command in this channel.`);
      }
      await interaction.editReply(`Linking ${a} ↔ ${b}. Please accept the link (\`/allow\`) in the other channel to respond.`);
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "An error occurred while linking the channels. Does the bot have permission to create webhooks in both channels?",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
