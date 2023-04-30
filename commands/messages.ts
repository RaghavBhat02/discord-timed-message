import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {  ChatInputCommandInteraction, CacheType } from 'discord.js';
import { APIInteractionDataResolvedChannel, CategoryChannel, NewsChannel, StageChannel, TextChannel, PrivateThreadChannel, PublicThreadChannel, VoiceChannel, ForumChannel } from 'discord.js';

import { MongoClient, ObjectId } from 'mongodb';
import { UUID } from 'bson'; 

const obj = {
    data: new SlashCommandBuilder()
		.setName('listmessages')
		.setDescription('lists all of the announcements/messages u r sending in the server through this bot.'),

	async execute(interaction: ChatInputCommandInteraction<CacheType>, mongoClient: MongoClient, intervalMap: Map<string,number> ) {
        const db = mongoClient.db('timed0');
        const collection = db.collection('messages');
        await interaction.deferReply();
      
       
        
        const thisGuild = await collection.findOne({ _id: interaction.guildId as unknown as ObjectId });
        if(!thisGuild) return;
        const embed = new EmbedBuilder()
            .setTitle('Your messages: ')

        for(const key in thisGuild) {
            if(key === '_id') continue;
            embed.addFields(
                { name: 'Message Id', value: key, inline: true },
                { name: 'Message/Announcement', value: thisGuild[key].announcement, inline: true },
                { name: 'Timer (in minutes)', value: (thisGuild[key].milliseconds / 1000 / 60).toString(), inline: true },
                { name: 'Channel', value: `<#${thisGuild[key].channel}>`, inline: true },
                { name: '\u200B', value: '\u200B' }
            )
        }
	    await interaction.followUp({ embeds: [embed]});
        return;
	},
}

export default obj;