const { SlashCommandBuilder, ChannelType } = require("discord.js");
const { addLink, addWebhook } = require("../../dbHandler.js");

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

    if (a.id === b.id) {
      return interaction.reply({
        content: "Pick two different channels.",
        ephemeral: true,
      });
    }
    try {
      const webhookA = await a.createWebhook({
        name: "portal-webhook",
      })
        .catch(console.error);
      const webhookB = await b.createWebhook({
        name: "portal-webhook",
      })
        .catch(console.error);

      if (!webhookA || !webhookB) {
        return interaction.reply({
          content: "An error occurred while creating webhooks. Does the bot have permission to create webhooks in both channels?",
          ephemeral: true,
        });
      }

      addWebhook(a.id, webhookA.id, webhookA.token);
      addWebhook(b.id, webhookB.id, webhookB.token);
      addLink(a.id, b.id);
      await interaction.reply(`Linked ${a} ↔ ${b}`);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while linking the channels. Does the bot have permission to create webhooks in both channels?",
        ephemeral: true,
      });
    }
  },
};
