import { spotify } from '../../lib'
import { BaseCommand, Command, Message } from '../../Structures'
import { IArgs } from '../../Types'

@Command('spotify', {
    description: 'Downloads the given Spotify track URL',
    category: 'media',
    usage: 'spotify [track_URL]',
    exp: 20,
    cooldown: 20,
    aliases: ['sp']
})
export default class command extends BaseCommand {
    override execute = async (M: Message, { context }: IArgs): Promise<void> => {
        if (!context) return void M.reply('*Provide a Spotify track URL to download*')
        const url = context.trim().split(' ')[0]
        const song = new spotify(url)
        const info = await song.getInfo()
        if (info.error) return void M.reply('Provide a valid Spotify track URL')
        const caption = `🎧 *Title:* ${info.name || ''}\n🎤 *Artists:* ${(info.artists || []).join(',')}\n💽 *Album:* ${
            info.album_name
        }\n📆 *Release Date:* ${info.release_date || ''}`
        await M.reply(
            await this.client.utils.getBuffer(info.cover_url as string),
            'image',
            undefined,
            undefined,
            caption
        )
        const audio = await this.client.utils.mp3ToOpus(await song.download())
        return void (await M.reply(audio, 'audio'))
    }
}
