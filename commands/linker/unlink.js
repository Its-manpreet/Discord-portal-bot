const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { removeLink } = require("../../dbHandler.js");

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

    removeLink(a.id, b.id);
    removeWebhook(a.id);
    removeWebhook(b.id);
    await interaction.reply(`Unlinked ${a} ↔ ${b}`);
  },
};