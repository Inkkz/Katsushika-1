import { YT } from '../../lib'
import { BaseCommand, Command, Message } from '../../Structures'

@Command('yta', {
    description: 'Downloads the video of the given YouTube video URL and sends it as an audio',
    exp: 30,
    category: 'media',
    usage: 'yta [URL]',
    cooldown: 30,
    aliases: ['ytaudio']
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        const url = M.urls.filter((url) => url.includes('youtu.be') || url.includes('youtube.com'))
        if (!url.length || url.length < 1) return void M.reply('Provide a YouTube video URL to download, Baka!')
        const { validate, download } = new YT(url[0], 'audio')
        if (!validate()) return void M.reply('*Provide a valid YouTube video URL*')
        const audio = await this.client.utils.mp3ToOpus(await download())
        return void (await M.reply(audio, 'audio'))
    }
}
