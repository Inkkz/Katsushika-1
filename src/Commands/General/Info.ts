import { join } from 'path'
import { BaseCommand, Command, Message } from '../../Structures'

@Command('info', {
    description: "Displays bot's info",
    usage: 'info',
    category: 'general',
    cooldown: 10,
    exp: 100
})
export default class extends BaseCommand {
    public override execute = async ({ reply }: Message): Promise<void> => {
        const { description, name, homepage } = require(join(__dirname, '..', '..', '..', 'package.json')) as {
            description: string
            homepage: string
            name: string
        }
        const image = this.client.assets.get('img') as Buffer
        const users = await this.client.DB.user.count()
        let getGroups = await this.client.groupFetchAllParticipating()
        let groups = Object.entries(getGroups).slice(0).map(entry => entry[1])
        let res = groups.map(v=> v.id)
        console.log(res.length)
        const uptime = this.client.utils.formatSeconds(process.uptime())
        const text = `🌟 *Katsushika* 🌟\n\n📙 *Description: ${description}*\n\n*👥Users:* ${users}\n\n*🚀Groups:* ${res.length}\n\n🔗 *Commands:* ${this.handler.commands.size}\n\n🚦 *Uptime:* ${uptime}`
        return void (await reply(image, 'image', undefined, undefined, text, undefined, {
            title: this.client.utils.capitalize(name),
            thumbnail: image,
            mediaType: 1,
            sourceUrl: homepage
        }))
    }
}
