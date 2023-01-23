import { BaseCommand, Command, Message } from '../../Structures'

@Command('toimg', {
    description: 'sticker to image',
    exp: 35,
    category: 'utils',
    aliases: [],
    usage: 'toimg',
    cooldown: 25
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        if (!M.quoted || (M.quoted && M.quoted.type !== 'stickerMessage')) return void M.reply('sticker?')
        const buffer = await M.downloadMediaMessage(M.quoted.message)
        this.client.log(`${Buffer.isBuffer(buffer)}`)
        try {
            const result = await this.client.utils.webpToImage(buffer)
            return void (await M.reply(result, 'image'))
        } catch (error) {
            return void (await M.reply('no animated'))
        }
    }
}
