import { BaseCommand, Command, Message } from '../../Structures'

@Command('delete', {
    description: '',
    category: 'moderation',
    usage: '',
    exp: 10,
    cooldown: 15,
    aliases: ['del']
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        if (!M.quoted) return void M.reply('Please tag the message you want me to delete!')
        const bot = this.client.correctJid(this.client.user?.id || '')
        if (M.quoted.sender.jid !== bot) return void M.reply(`I can't delete messages that I didn't send, baka!`)
        return void (await this.client.sendMessage(M.from, {
            delete: M.quoted.key
        }))
    }
}
