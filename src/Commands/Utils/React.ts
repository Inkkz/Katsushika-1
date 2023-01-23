import { Command, BaseCommand, Message } from '../../Structures'

@Command('react', {
    category: 'utils',
    description: 'Reacts a message with the given emoji',
    usage: 'react [emoji] || react [emoji] [quote a message]',
    cooldown: 5,
    exp: 10
})
export default class extends BaseCommand {
    override execute = async ({ react, quoted, emojis, message }: Message): Promise<void> => {
        const key = quoted ? quoted.key : message.key
        return void (await react(emojis[0] || '👍', key))
    }
}
