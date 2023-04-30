import { SlashCommandBuilder, ChannelType } from 'discord.js';
import {  ChatInputCommandInteraction, CacheType } from 'discord.js';
import { APIInteractionDataResolvedChannel, CategoryChannel, NewsChannel, StageChannel, TextChannel, PrivateThreadChannel, PublicThreadChannel, VoiceChannel, ForumChannel } from 'discord.js';

import { MongoClient, ObjectId } from 'mongodb';
import { UUID } from 'bson'; 

const obj = {
    data: new SlashCommandBuilder()
		.setName('setmessage')
		.setDescription('sets a timed Announcement.')
        .addChannelOption(opt => opt.setName('channel').setDescription('The channel to echo into').setRequired(true))
        .addNumberOption(opt => opt.setName('time').setDescription('The time in minutes.').setRequired(true))
        .addStringOption(opt => opt.setName('announcement').setDescription('the announcement to repeat.').setRequired(true)),

	async execute(interaction: ChatInputCommandInteraction<CacheType>, mongoClient: MongoClient, intervalMap: Map<string,number> ) {
        const db = mongoClient.db('timed0');
        const collection = db.collection('messages');
        await interaction.deferReply();
        const channel = interaction.options.getChannel('channel') as CategoryChannel | NewsChannel | StageChannel | TextChannel | PrivateThreadChannel | PublicThreadChannel<boolean> | VoiceChannel | ForumChannel | null;
        const initTime = interaction.options.getNumber('time');
        const announcement = interaction.options.getString('announcement');
        if(!channel) {
            await interaction.reply('No channel provided or channel is not text based.')
            return;
        }
        if(channel.type === ChannelType.GuildCategory || channel.type === ChannelType.GuildForum || (channel as unknown as APIInteractionDataResolvedChannel).permissions !== undefined || channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
            await interaction.reply('channel is not a text channel.')
            return;
        }
        if(!announcement) {
            await interaction.reply('no annoucnement provided.');
            return;
        }
        if(!initTime) {
            await interaction.reply('no time (in hours) given.');
            return;
        }
        const interval = setInterval(() => {
            channel.send(announcement);
        }, initTime * 1000 * 60)
        const uuid = new UUID().toString();
        intervalMap.set(interaction.guildId + uuid, interval[Symbol.toPrimitive]())
        await collection.updateOne(
            { _id: interaction.guildId as unknown as ObjectId }, 
            { $set: 
                { 
                    _id: interaction.guildId,
                    [uuid]: {
                        channel: channel.id,
                        announcement,
                        milliseconds: initTime * 1000 * 60
                    }
                }
            }, 
            { upsert: true });
	    await interaction.followUp(`You have successfully set the following message \n----- \n${announcement} \n----- \n in channel ${channel} every ${initTime} minutes. `);
        return;
	},
}

export default obj;