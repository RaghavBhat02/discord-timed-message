import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import {  ChatInputCommandInteraction, CacheType } from 'discord.js';
import { MongoClient, ObjectId } from 'mongodb';

const obj = {
    data: new SlashCommandBuilder()
		.setName('removemessage')
		.setDescription('sets a timed Announcement.')
        .addStringOption(opt => opt.setName('messageid').setDescription('The id of the messaeg to remove.').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction: ChatInputCommandInteraction<CacheType>, mongoClient: MongoClient, intervalMap: Map<string,number> ) {
        const db = mongoClient.db('timed0');
        const collection = db.collection('messages');
        await interaction.deferReply();
       
        const messageId = interaction.options.getString('messageid');
        if(!messageId) {
            await interaction.followUp('You have not provided the id of the message you want to delete.');
            return;
        }
        const result = await collection.updateOne({ _id: interaction.guildId as unknown as ObjectId },{ $unset: { [messageId]: ""} });
        if (result.modifiedCount === 1) {
            console.log('delete success.');
        } else {
            throw Error("Unable to delete, source of problem: Mongo" + result);
        }
        const intervalNum = intervalMap.get(interaction.guildId + messageId);
        clearInterval(intervalNum);
        intervalMap.delete(interaction.guildId + messageId);
       
	    await interaction.followUp(`You have successfully deleted the message with id \`${messageId}\``);
        return;
	},
}

export default obj;