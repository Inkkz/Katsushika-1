import { BaseCommand, Command, Message } from '../../Structures'
import { IArgs } from '../../Types'
import { YT } from '../../lib'
import yts from 'yt-search'
import { AnyMessageContent } from '@adiwajshing/baileys'

@Command('play', {
    description: 'Plays the given song',
    category: 'media',
    usage: 'play [song]',
    exp: 20,
    aliases: ['song'],
    cooldown: 25
})
export default class command extends BaseCommand {
    override execute = async (M: Message, { context }: IArgs): Promise<void> => {
        if (!context) return void M.reply('Provide the song name that you want to play')
        const term = context.trim()
        const { videos } = await yts(term)
        if (!videos || videos.length < 1) return void M.reply(`No matching songs found of the given term | *"${term}"*`)
        const yt = new YT(videos[0].url, 'audio')
        const audio = await this.client.utils.mp3ToOpus(await yt.download())
        return void (await this.client.sendMessage(
            M.from,
            {
                audio,
                contextInfo: {
                    externalAdReply: {
                        title: videos[0].title.substr(0, 30),
                        body: videos[0].description.substr(0, 30),
                        mediaType: 2,
                        thumbnail: await this.client.utils.getBuffer(videos[0].thumbnail),
                        mediaUrl: videos[0].url
                    }
                }
            } as unknown as AnyMessageContent,
            {
                quoted: M.message
            }
        ))
    }
}
