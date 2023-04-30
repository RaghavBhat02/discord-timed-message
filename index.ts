import { Client, Events, GatewayIntentBits, Collection, TextBasedChannel } from 'discord.js';
import type { CommandClient } from './types';
import fs from 'node:fs';
import path from 'node:path';
import { MongoClient, ServerApiVersion, ObjectId, WithId, Document } from 'mongodb';
require('dotenv').config();
const mongoUri = process.env.URI as string;
const mongoClient = new MongoClient(mongoUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
const intervalMap = new Map<string, number>()

mongoConnect();

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


async function mongoConnect() {
    await mongoClient.connect();
    const db = mongoClient.db('timed0');
    const ping = await db.command({ping: 1 });
    console.log(`Successfully connected to db. Ping is ${ping}`)
    const collection = db.collection('messages');


    const messagePromises: Promise<WithId<Document> | null>[] = []
    client.guilds.cache.forEach(guild => {
        messagePromises.push(collection.findOne({ _id: guild.id as unknown as ObjectId }));
    })
    const settled = await Promise.allSettled(messagePromises);
    const guilds = settled.map(promise => {
        if(promise.status !== 'fulfilled') {
            console.error("ERROR in retrieving messages.");
            console.error(promise.status);
            console.error(promise.reason);
            return;
        }

        return promise.value

    })

    for(const guild of guilds) {
        if(!guild) continue;
        for(const key in guild) {
            if(key === "_id") continue;

            const channel = client.guilds.cache.get(guild._id as unknown as string)?.channels.cache.get(guild[key].channel) as TextBasedChannel;
            if(channel) {
                const interval = setInterval(() => {
                    channel.send(guild[key].announcement);
                }, guild[key].milliseconds)
                intervalMap.set(guild._id + key, interval[Symbol.toPrimitive]());
            }
        }
    }
    
    return db;
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
		await command.execute(interaction, mongoClient, intervalMap);
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
