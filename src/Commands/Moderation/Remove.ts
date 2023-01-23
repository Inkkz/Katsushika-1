import { BaseCommand, Command, Message } from '../../Structures'

@Command('remove', {
    description: '',
    category: 'moderation',
    usage: '',
    cooldown: 10,
    exp: 10,
    adminRequired: true
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        if (!M.groupMetadata) return void M.reply('*Try Again!*')
        const users = M.mentioned
        if (M.quoted && !users.includes(M.quoted.sender.jid)) users.push(M.quoted.sender.jid)
        if (!users.length || users.length < 1) return void M.reply('Tag the users that you want to remove.')
        const mentioned = users
        let text = ''
        for (const user of users) {
            const i = users.indexOf(user)
            if (i === 0) text += '\n'
            if (user === M.groupMetadata.owner || '') {
                text += `Skipped @${user.split('@')[0]} as they're the owner.`
                continue
            }
            await this.client.groupParticipantsUpdate(M.from, [user], 'remove')
            text += `*🚥Status:*\n\n✅Removed @${user.split('@')[0]}`
        }
        return void M.reply(text, 'text', undefined, undefined, undefined, mentioned)
    }
}
