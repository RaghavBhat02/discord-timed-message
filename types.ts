import { Client, Collection } from 'discord.js';

export interface CommandClient extends Client {
    commands?: Collection<any, any>
}