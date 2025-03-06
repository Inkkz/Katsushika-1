import { BaseCommand, Command, Message } from '../../Structures'

@Command('hi', {
    description: 'Says hi to the bot',
    category: 'general',
    aliases: ['hello'],
    exp: 5,
    cooldown: 5,
    usage: 'hi'
})
export default class command extends BaseCommand {
    override execute = async ({ reply, sender }: Message): Promise<void> => void reply(`Hello! *${sender.username}*`)
}
