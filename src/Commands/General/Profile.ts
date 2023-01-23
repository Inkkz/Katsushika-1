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
        const { description, name } = require(join(__dirname, '..', '..', '..', 'package.json')) as {
            description: string
            name: string
        }
        const image = this.client.assets.get('mizu') as Buffer
        const users = await this.client.DB.user.count();
        const uban = await this.client.DB.user.countDocuments({ ban: true });
        const uptime = this.client.utils.formatSeconds(process.uptime())
        const text = `*━━━❰ Katsushika🚀 ❱━━━*\n\n📑 *Description: ${description}*\n\n📪 *Commands:* ${this.handler.commands.size}\n\n👥 *Users:* ${users}\n\n🚦 *Uptime:* ${uptime}\n\n🏗 *Company:* Sapphire🈲`
        return void (await reply(image, 'image', undefined, undefined, text, undefined, {
            title: this.client.utils.capitalize(name),
            thumbnail: image,
            mediaType: 1,
        }))
    }
}