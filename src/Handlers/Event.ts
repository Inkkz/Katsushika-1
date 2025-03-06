import chalk from 'chalk'
import { Client } from '../Structures'
import { IEvent } from '../Types'

export class EventHandler {
    constructor(private client: Client) {}

    public handleEvents = async (event: IEvent): Promise<void> => {
        let group: { subject: string; description: string } = {
            subject: '',
            description: ''
        }
        this.handleMods(event)
        await this.client
            .groupMetadata(event.jid)
            .then((res) => {
                group.subject = res.subject
                group.description = res.desc || 'No Description'
            })
            .catch(() => {
                group.subject = '__'
                group.description = ''
            })
        this.client.log(
            `${chalk.blueBright('EVENT')} ${chalk.green(
                `${this.client.utils.capitalize(event.action)}[${event.participants.length}]`
            )} in ${chalk.cyanBright(group.subject)}`
        )
        const { events, bot } = await this.client.DB.getGroup(event.jid)
        if (
            !events ||
            bot !== this.client.config.name.split(' ')[0] ||
            (event.action === 'remove' &&
                event.participants.includes(
                    `${(this.client.user?.id || '').split('@')[0].split(':')[0]}@s.whatsapp.net`
                ))
        )
            return void null
        const text =
            event.action === 'add'
                ? `- ${group.subject} -\n\n💈 *Group Description:*\n${
                      group.description
                  }\n\nHope you follow the rules and have fun!\n\n*‣ ${event.participants
                      .map((jid) => `@${jid.split('@')[0]}`)
                      .join(' ')}*`
                : event.action === 'remove'
                ? `Goodbye *${event.participants
                      .map((jid) => `@${jid.split('@')[0]}`)
                      .join(', ')}* 👋🏻, we're probably not gonna miss you.`
                : event.action === 'demote'
                ? `Ara Ara, looks like *@${event.participants[0].split('@')[0]}* got Demoted`
                : `Congratulations *@${event.participants[0].split('@')[0]}*, you're now an admin`
        if (event.action === 'add') {
            let image!: Buffer
            try {
                image = await this.client.utils.getBuffer(
                    (await this.client.profilePictureUrl(event?.jid || '', 'image')) || ''
                )
            } catch (error) {
                image = this.client.assets.get('404') as Buffer
            }
            return void (await this.client.sendMessage(event.jid, {
                image: image,
                mentions: event.participants,
                caption: text,
                jpegThumbnail: image.toString('base64')
            }))
        }
        return void (await this.client.sendMessage(event.jid, {
            text,
            mentions: event.participants
        }))
    }

    public sendMessageOnJoiningGroup = async (group: { subject: string; jid: string }): Promise<void> => {
        this.client.log(`${chalk.blueBright('JOINED')} ${chalk.cyanBright(group.subject)}`)
        return void (await this.client.sendMessage(group.jid, {
            text: `Thanks for adding me in this group. Please use *${this.client.config.prefix}help* to get started.`
        }))
    }

    private handleMods = (event: IEvent): void => {
        if (
            event.jid !== this.client.config.adminsGroup ||
            (event.action !== 'promote' && event.action !== 'demote' && event.action !== 'remove')
        )
            return void null
        event.action === 'promote'
            ? this.client.config.mods.push(event.participants[0])
            : this.client.config.mods.splice(this.client.config.mods.indexOf(event.participants[0]), 1)
    }
}
