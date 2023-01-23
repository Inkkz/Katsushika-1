import { BaseCommand, Command, Message } from '../../Structures'

@Command('info', {
    category: 'general',
    aliases: ['alive'],
    description: 'shows bot info',
    usage: 'info',
    exp: 10
})
export default class command extends BaseCommand {
    public override execute = async ({ reply }: Message): Promise<void> => {
    const users = await this.client.DB.user.count()
    const uptime = this.client.utils.formatSeconds(process.uptime())
    let getGroups = await this.client.groupFetchAllParticipating()
    let groups = Object.entries(getGroups).slice(0).map(entry => entry[1])
    let res = groups.map(v=> v.id)
    console.log(res.length)
        
        return void (await reply(
            `*━━━❰ KATSUSHIKA BOT ❱━━━*\n\n🔗 *Commands:* ${this.handler.commands.size}\n\n🔮 *Groups:* ${res.length}\n\n🎐 *Users:* ${users}\n\n🚦 *Uptime:* ${uptime}`
        ))
    }
}
