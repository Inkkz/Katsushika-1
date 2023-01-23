import chalk from 'chalk'
import { WACallEvent } from '@adiwajshing/baileys'
import { Client } from '../Structures'

export class CallHandler {
    constructor(private client: Client) {}

    public handleCall = async (call: WACallEvent): Promise<void> => {
        const caller = call.from
        const { username } = this.client.contact.getContact(caller)
        this.client.log(`${chalk.cyanBright('Call')} from ${chalk.blueBright(username)}`)
        await this.client.rejectCall(call)
        await this.client.sendMessage(caller, { text: 'You have been banned for calling the bot fool!' })
        await this.client.DB.banUser(caller, 'Automatic-Ban', 'DM', 'For calling the bot')
        return void (await this.client.updateBlockStatus(caller, 'block'))
    }
}
