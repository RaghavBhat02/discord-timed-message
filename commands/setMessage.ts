import { SlashCommandBuilder, ChannelType } from 'discord.js';
import {  ChatInputCommandInteraction, CacheType } from 'discord.js';
import { CategoryChannel, NewsChannel, StageChannel, TextChannel, PrivateThreadChannel, PublicThreadChannel, VoiceChannel, ForumChannel } from 'discord.js';
const obj = {
    data: new SlashCommandBuilder()
		.setName('setmessage')
		.setDescription('sets a timed Announcement.')
        .addChannelOption(opt => opt.setName('channel').setDescription('The channel to echo into').setRequired(true))
        .addNumberOption(opt => opt.setName('time').setDescription('The time in minutes.').setRequired(true))
        .addStringOption(opt => opt.setName('announcement').setDescription('the announcement to repeat.').setRequired(true)),
	async execute(interaction: ChatInputCommandInteraction<CacheType>) {
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
        setInterval(() => {
            channel.send(announcement);

        }, initTime * 1000 * 60)
	    await interaction.followUp(`You have successfully set message \n----- \n${announcement} \n----- \n in channel ${channel} every ${initTime} minutes.`);
        return;
	},
}

export default obj;