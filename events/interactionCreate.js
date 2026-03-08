const config = require("../config.js");
const { InteractionType } = require('discord.js');
const path = require("path");
const colors = require('../UI/colors/colors');
const { getLang, getLangSync } = require('../utils/languageLoader.js');

module.exports = async (client, interaction) => {
  try {

    if (interaction.type === InteractionType.ApplicationCommand) {

      if (!interaction?.guild) {
        const lang = await getLang(interaction.guildId).catch(() => getLangSync());
        return interaction?.reply({ 
          content: lang.events?.interactionCreate?.noGuild || 'This command can only be used in a server.', 
          ephemeral: true 
        });
      }

      const command = client.commands.get(interaction.commandName);

      if (!command) {
        const consoleLang = getLangSync();
        console.error(`${colors.cyan}[ INTERACTION ]${colors.reset} ${colors.red}${consoleLang.console?.events?.interaction?.commandNotFound?.replace('{commandName}', interaction.commandName) || `Command not found: ${interaction.commandName}`}${colors.reset}`);
        const lang = getLangSync();
        return interaction?.reply({ 
          content: lang.events?.interactionCreate?.commandNotFound || 'Command not found.', 
          ephemeral: true 
        });
      }

      const requiredPermissions = command.permissions || "0x0000000000000800";
      if (!interaction?.member?.permissions?.has(requiredPermissions)) {
        const lang = getLangSync();
        return interaction?.reply({ 
          content: lang.events?.interactionCreate?.noPermission || 'You do not have permission to use this command.', 
          ephemeral: true 
        });
      }

      // CORRIGIDO: sem await getLang antes de rodar o comando
      // O comando deve fazer deferReply imediatamente dentro dos 3 segundos
      try {
        await command.run(client, interaction);
      } catch (error) {
        const consoleLang = getLangSync();
        console.error(`${colors.cyan}[ INTERACTION ]${colors.reset} ${colors.red}${consoleLang.console?.events?.interaction?.errorExecuting?.replace('{commandName}', interaction.commandName) || `Error executing command ${interaction.commandName}:`}${colors.reset}`, error);
        
        const lang = getLangSync();
        const errorMessage = lang.events?.interactionCreate?.errorOccurred?.replace('{message}', error.message) || `An error occurred: ${error.message}`;
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ 
            content: errorMessage, 
            ephemeral: true 
          }).catch(() => {});
        } else {
          await interaction.reply({ 
            content: errorMessage, 
            ephemeral: true 
          }).catch(() => {});
        }
      }
    }

    if (interaction.isButton()) {

      if (interaction.customId === 'help_back_main') {
        try {
          await interaction.deferUpdate();
          const helpCommand = client.commands.get('help');
          if (helpCommand && helpCommand.helpers) {
            const botName = client.user.username;
            const totalCommands = client.commands.size;
            const totalServers = client.guilds.cache.size;
            const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
            const uptime = process.uptime();
            const days = Math.floor(uptime / (3600 * 24));
            const hours = Math.floor((uptime % (3600 * 24)) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            const ping = client.ws.ping;
            const embedColor = parseInt(config.embedColor?.replace('#', '') || '1db954', 16);
            
            const result = await helpCommand.helpers.showMainMenu(client, interaction, embedColor, totalCommands, totalServers, totalUsers, uptimeString, ping, botName);
            return result;
          }
        } catch (error) {
          const consoleLang = getLangSync();
          console.error(consoleLang.console?.events?.interaction?.errorHelpButton || 'Error handling help back button:', error);
          const lang = getLangSync();
          try {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({ content: lang.events?.interactionCreate?.errorTryAgain || 'An error occurred. Please try again.', ephemeral: true });
            } else {
              await interaction.followUp({ content: lang.events?.interactionCreate?.errorTryAgain || 'An error occurred. Please try again.', ephemeral: true });
            }
          } catch (e) {}
        }
        return;
      }

    }

    if (interaction.isStringSelectMenu()) {

      if (interaction.customId === 'help_category_select') {
        try {
          await interaction.deferUpdate();
          const selectedCategory = interaction.values[0];
          const helpCommand = client.commands.get('help');
          if (helpCommand && helpCommand.helpers) {
            const botName = client.user.username;
            const embedColor = parseInt(config.embedColor?.replace('#', '') || '1db954', 16);
            
            const result = await helpCommand.helpers.showCategoryPage(client, interaction, selectedCategory, embedColor, botName);
            return result;
          }
        } catch (error) {
          const consoleLang = getLangSync();
          console.error(consoleLang.console?.events?.interaction?.errorHelpSelect || 'Error handling help category select:', error);
          const lang = getLangSync();
          try {
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({ content: lang.events?.interactionCreate?.errorTryAgain || 'An error occurred. Please try again.', ephemeral: true });
            } else {
              await interaction.followUp({ content: lang.events?.interactionCreate?.errorTryAgain || 'An error occurred. Please try again.', ephemeral: true });
            }
          } catch (e) {}
        }
        return;
      }
    }

  } catch (error) {
    const consoleLang = getLangSync();
    console.error(`${colors.cyan}[ INTERACTION ]${colors.reset} ${colors.red}${consoleLang.console?.events?.interaction?.unexpectedError || 'Unexpected error:'}${colors.reset}`, error);
    
    const lang = getLangSync();
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: lang.events?.interactionCreate?.unexpectedError || 'An unexpected error occurred.', 
          ephemeral: true 
        }).catch(() => {});
      } else {
        await interaction.reply({ 
          content: lang.events?.interactionCreate?.unexpectedError || 'An unexpected error occurred.', 
          ephemeral: true 
        }).catch(() => {});
      }
    } catch (replyError) {
      console.error(`${colors.cyan}[ INTERACTION ]${colors.reset} ${colors.red}${consoleLang.console?.events?.interaction?.failedToSendError || 'Failed to send error message:'}${colors.reset}`, replyError);
    }
  }
};
