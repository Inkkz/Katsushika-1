import yts from 'yt-search'
import { BaseCommand, Command, Message } from '../../Structures'
import { IArgs } from '../../Types'
import { AnyMessageContent } from '@adiwajshing/baileys'

@Command('yts', {
    description: 'Searches the given term in YouTube',
    exp: 30,
    category: 'media',
    usage: 'yts [query]',
    cooldown: 10,
    aliases: ['ytsearch']
})
export default class command extends BaseCommand {
    override execute = async (M: Message, { context }: IArgs): Promise<void> => {
        if (!context) return void M.reply('Provide a query to search, Baka!')
        const term = context.trim()
        const { videos } = await yts(term)
        if (!videos || videos.length < 1)
            return void M.reply(`No matching videos found for the given query | *"${term}"*`)
        let text = ''
        const length = videos.length < 10 ? videos.length : 10
        for (let i = 0; i < length; i++) {
            text += `*#${i + 1}*\n📗 *Title:* ${videos[i].title}\n📕 *Channel:* ${
                videos[i].author.name
            }\n 📙 *Duration:* ${videos[i].duration}s\n📘 *URL:* ${videos[i].url}\n\n`
        }
        return void (await this.client.sendMessage(
            M.from,
            {
                text,
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
