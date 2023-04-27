import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import type { CommandClient } from './types';
import fs from 'node:fs';
import path from 'node:path';

require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] }) as CommandClient;
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath).default;
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
        console.log(command);
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});


async function begin() {
    const guild = await client.guilds.fetch('1100901718973239427');
    const channel = await guild.channels.fetch('1100901719623335998');
    if(!channel) {
        console.error("Not an existing channel.")
        return;
    }

    if(!channel.isTextBased()) {
        console.error('not text based.');
        return;
    }

    let count = 0;
    setInterval(() => {
        ++count;
        channel.send(`This is an announcement. It repeats every 10s. ${count}`);
    }, 10000)
}


client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const client = interaction.client as CommandClient;
    if(!client.commands) {
        console.error("no commands");
        return;
    }
    const command = client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});


client.login(process.env.TOKEN);
begin();
