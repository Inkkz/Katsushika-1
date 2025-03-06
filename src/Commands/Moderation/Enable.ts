import { BaseCommand, Command, Message } from '../../Structures'
import { IArgs, TGroupFeature } from '../../Types'

@Command('enable', {
    description: 'Enables a certain feature of a group',
    category: 'moderation',
    usage: 'enable [feature]',
    exp: 10,
    cooldown: 10
})
export default class command extends BaseCommand {
    override execute = async (M: Message, { context }: IArgs): Promise<void> => {
        if (!context) {
            let text = `♻ *Available Features* ♻`
            const buttons = []
            for (const info of this.info) {
                text += `\n\n${info.emoji} *${this.client.utils.capitalize(info.feature)}* ${
                    info.emoji
                }\n📄 *Description:* ${info.description}\n🎗 *TODO:* ${this.client.config.prefix}enable ${info.feature}`
                if (buttons.length >= 3) continue
                buttons.push({
                    buttonId: `id${Math.floor(Math.random() * 1234)}`,
                    buttonText: { displayText: `${this.client.config.prefix}enable ${info.feature}` },
                    type: 1
                })
            }
            return void M.reply(text)
        }
        const feature = context.split(' ')[0].toLowerCase().trim() as TGroupFeature
        if (this.info.findIndex((x) => x.feature === feature) < 0) {
            const buttons = [
                {
                    buttonId: 'id1',
                    buttonText: { displayText: `${this.client.config.prefix}enable` },
                    type: 1
                }
            ]
            const buttonMessage = {
                text: `*Invalid option.* Use *${this.client.config.prefix}enable* to see all of the available features`,
                footer: '',
                buttons: buttons,
                headerType: 1
            }
            return void (await this.client.sendMessage(M.from, buttonMessage))
        }
        const group = await this.client.DB.getGroup(M.from)
        if (group[feature])
            return void M.reply(`🟨 *${this.client.utils.capitalize(feature)}* is already enabled, Baka!`)
        await this.client.DB.updateGroup(M.from, feature, true)
        if (feature === 'news' || feature === 'wild' || feature === 'cards') {
            const i = feature === 'news' ? 'news' : feature === 'cards' ? 'card' : 'wild'
            this.handler[i].push(M.from)
        }
        return void M.reply(`🟩 *${this.client.utils.capitalize(feature)}* is enabled`)
    }

    private info: IGroupFeatureInfo[] = [
        {
            feature: 'news',
            description:
                'Enables the bot to send news whenever there is an update related to anime, manga or novel stuffds',
            emoji: '📰'
        },
        {
            feature: 'cards',
            description: 'Enables the bot to spawn cards (from Shoob) which can be claimed',
            emoji: '🃏'
        },
        {
            feature: 'events',
            description: 'Enables the bot to welcome new members or give farewell to the ones who left the group',
            emoji: '🎡'
        },
        {
            feature: 'mods',
            description:
                'Enables the bot to remove the member which sent an invite link for other group (will work if and only if the bot is admin)',
            emoji: '🧧'
        },
        {
            feature: 'nsfw',
            description: 'Enables the bot to send NSFW contents in the group',
            emoji: '🔰'
        },
        {
            feature: 'wild',
            description: 'Enables the bot to spawn wild pokemons which can be caught',
            emoji: '🎐'
        }
    ]
}

interface IGroupFeatureInfo {
    feature: TGroupFeature
    description: string
    emoji: '📰' | '🧧' | '🎐' | '🎡' | '🃏' | '🔰'
}
