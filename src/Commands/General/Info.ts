import { BaseCommand, Command, Message } from '../../Structures'

@Command('info', {
    category: 'general',
    aliases: ['alive'],
    description: 'shows bot info',
    usage: 'info',
    exp: 10
})
export default class command extends BaseCommand {
    public override execute = async (M: Message): Promise<void> => {
    const users = await this.client.DB.user.count()
    const uptime = this.client.utils.formatSeconds(process.uptime())
    let getGroups = await this.client.groupFetchAllParticipating()
    let groups = Object.entries(getGroups).slice(0).map(entry => entry[1])
    let res = groups.map(v=> v.id)
    console.log(res.length)

        const buttons = [
            {
                buttonId: 'id1',
                buttonText: { displayText: `${this.client.config.prefix}help` },
                type: 1
            },
            {
                buttonId: 'id2',
                buttonText: { displayText: `${this.client.config.prefix}support` },
                type: 1
            }
        ]
        const buttonMessage = {
            text: `*👥Users:* ${users}\n*🏅Mods:* ${this.client.config.mods.length}\n*🚀Groups:* ${res.length}\n*📪Commands:* ${this.handler.commands.size}\n*🚦Uptime:* ${uptime}`,
            footer: 'Katsushika',
            buttons: buttons,
            headerType: 1
        }
        return void (await this.client.sendMessage(M.from, buttonMessage, {
            quoted: M.message
        }))
    }
}
