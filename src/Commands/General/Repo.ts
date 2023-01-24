import { join } from 'path'
import { BaseCommand, Command, Message } from '../../Structures'

@Command('repo', {
    description: "Displays bot's information",
    usage: 'repo',
    category: 'general',
    cooldown: 5,
    exp: 20
})
export default class extends BaseCommand {
    public override execute = async ({ reply }: Message): Promise<void> => {
        const { name } = require(join(__dirname, '..', '..', '..', 'package.json')) as {
            name: string
        }
        const image = this.client.assets.get('img') as Buffer
        const text = `*━━━❰ Bot Repo ❱━━━*\n\n⚜𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: An anime themed WhatsApp bot written in Typescript using baileys.\n\n🚥𝗦𝘁𝗮𝘁𝘂𝘀: Bot in development stage.\n\n🧩𝗛𝗶𝗻𝘁: The bot is an open source project, therefore you can deploy a version of it;
(https://github.com/Issa2001/Katsushika)\n\n⭐𝗜𝗻𝗳𝗼: This bot is using a base of WhatsApp-bot, we therefore don't have any copyright or either affiliated with WhatsApp-bot anyhowly. Thanks to Lucky Yambem for base bot.
(https://github.com/LuckyYam/WhatsApp-bot)\n\n📃𝗟𝗶𝗰𝗲𝗻𝘀𝗲: You may obtain a copy of the License at;
http://www.gnu.org/licenses/\n\n(𝗚𝗡𝗨 𝗔𝗙𝗙𝗘𝗥𝗢 𝗚𝗘𝗡𝗘𝗥𝗔𝗟 𝗣𝗨𝗕𝗟𝗜𝗖 𝗟𝗜𝗖𝗘𝗡𝗦𝗘).
»𝖵𝖾𝗋𝗌𝗂𝗈𝗇 3.0 \n`
        return void (await reply(image, 'image', undefined, undefined, text, undefined, {
            title: this.client.utils.capitalize(name),
            thumbnail: image,
            mediaType: 1,
        }))
    }
}
