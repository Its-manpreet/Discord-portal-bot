const { SlashCommandBuilder, ChannelType, MessageFlags, PermissionsBitField } = require("discord.js");
const { removeLink, removeWebhook, removeStickyMessage, getStickyMessage, getTargets } = require("../../dbHandler.js");

module.exports = {
  cooldown: 5, 
  data: new SlashCommandBuilder()
    .setName("unlink")
    .setDescription("Unlink two channels")
    .addChannelOption(o => o.setName("first").setDescription("First channel")
      .addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addChannelOption(o => o.setName("second").setDescription("Second channel")
      .addChannelTypes(ChannelType.GuildText).setRequired(true)),

  async execute(interaction) {
    const a = interaction.options.getChannel("first");
    const b = interaction.options.getChannel("second");

    if (a.id === b.id) {
      return interaction.reply({ content: "Pick two different channels.", ephemeral: true });
    }

    if (interaction.member.permissions.has([PermissionsBitField.Flags.ManageWebhooks, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ManageChannels]) === false) {
      return interaction.reply({
        content: "You need the `Manage Webhooks`, `Manage Messages`, and `Manage Channels` permissions to use this command.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ });

    if (!getTargets(a.id)?.includes(b.id)) {
      return interaction.editReply(`The channels ${a} and ${b} are not linked.`);
    }

    removeLink(a.id, b.id);
    removeWebhook(a.id);
    removeWebhook(b.id);

    const stickyMessageIdA = getStickyMessage(a.id);
    if (stickyMessageIdA) {
      await a.messages.fetch(stickyMessageIdA).then(msg => msg.edit(`This channel is no longer linked to another channel.`)).catch(console.error);
      removeStickyMessage(a.id);
    }

    const stickyMessageIdB = getStickyMessage(b.id);
    if (stickyMessageIdB) {
      await b.messages.fetch(stickyMessageIdB).then(msg => msg.edit(`This channel is no longer linked to another channel.`)).catch(console.error);
      removeStickyMessage(b.id);
    }

    await interaction.editReply(`Unlinked ${a} ↔ ${b}`);
  },
};