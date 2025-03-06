import { join } from 'path'
import { readdirSync } from 'fs-extra'
import chalk from 'chalk'
import { AnyMessageContent, proto, delay } from '@adiwajshing/baileys'
import { schedule } from 'node-cron'
import { Message, Client, BaseCommand } from '../Structures'
import { getStats } from '../lib'
import { ICommand, IArgs, IPokemonAPIResponse, WaifuResponse, TCardsTier, IGroup } from '../Types'
import { Pokemon, Card, PokemonMove } from '../Database'
import { PokemonClient } from 'pokenode-ts'
import { ICharacter, Character } from '@shineiichijo/marika'
import Game from 'chess-node'

export class MessageHandler {
    constructor(private client: Client) {}

    public groups!: string[]

    public card: string[] = []

    public wild: string[] = []

    public chara: string[] = []

    public chess = {
        games: new Map<string, Game | undefined>(),
        challenges: new Map<string, { challenger: string; challengee: string } | undefined>(),
        ongoing: new Set<string>()
    }

    public charaResponse = new Map<string, { price: number; data: ICharacter }>()

    public loadCharaEnabledGroups = async (): Promise<void> => {
        const groups = !this.groups ? await this.client.getAllGroups() : this.groups
        for (const group of groups) {
            const data = await this.client.DB.getGroup(group)
            if (!data.chara) continue
            this.chara.push(group)
        }
        this.client.log(
            `Successfully loaded ${chalk.blueBright(`${this.chara.length}`)} ${
                this.chara.length > 1 ? 'groups' : 'group'
            } which has enabled chara`
        )
        await this.spawnChara()
    }

    private spawnChara = async (): Promise<void> => {
        schedule('*/5 * * * *', async () => {
            if (this.chara.length < 1) return void null
            for (let i = 0; i < this.chara.length; i++) {
                setTimeout(async () => {
                    const { chara, bot } = await this.client.DB.getGroup(this.wild[i])
                    if (bot !== 'all' && bot !== this.client.config.name.split(' ')[0]) return void null
                    if (!chara) return void null
                    await new Character()
                        .getRandomCharacter()
                        .then(async (chara) => {
                            const price = Math.floor(Math.random() * (50000 - 25000) + 25000)
                            let source = ''
                            await new Character()
                                .getCharacterAnime(chara.mal_id)
                                .then((res) => (source = res.data[0].anime.title))
                                .catch(async () => {
                                    await new Character()
                                        .getCharacterManga(chara.mal_id.toString())
                                        .then((res) => (source = res.data[0].manga.title))
                                        .catch(() => {})
                                })
                            const buffer = await this.client.utils.getBuffer(chara.images.jpg.image_url)
                            const buttons = [
                                {
                                    buttonId: 'id1',
                                    buttonText: { displayText: `${this.client.config.prefix}claim` },
                                    type: 1
                                }
                            ]
                            const buttonMessage = {
                                image: buffer,
                                jpegThumbnail: buffer.toString('base64'),
                                caption: `*A claimable character Appeared!*\n\n🏮 *Name: ${chara.name}*\n\n📑 *About:* ${chara.about}\n\n🌐 *Source: ${source}*\n\n💰 *Price: ${price}*\n\n*[Use ${this.client.config.prefix}claim to have this character in your gallery]*`,
                                footer: '',
                                buttons: buttons,
                                headerType: 4
                            }
                            this.charaResponse.set(this.chara[i], { price, data: chara })
                            await this.client.sendMessage(this.chara[i], buttonMessage)
                        })
                        .catch(() => {})
                }, (i + 1) * 20 * 1000)
            }
        })
    }

    private spawnPokemon = async (): Promise<void> => {
        schedule('*/11 * * * *', async () => {
            if (this.wild.length < 1) return void null
            for (let i = 0; i < this.wild.length; i++) {
                setTimeout(async () => {
                    const { wild, bot } = await this.client.DB.getGroup(this.wild[i])
                    if (bot !== 'all' && bot !== this.client.config.name.split(' ')[0]) return void null
                    if (!wild) return void null
                    const id = Math.floor(Math.random() * 898)
                    const data = await this.client.utils.fetch<IPokemonAPIResponse>(
                        `https://pokeapi.co/api/v2/pokemon/${id}`
                    )
                    const level = Math.floor(Math.random() * (30 - 15) + 15)
                    const pokemonLevelCharts = await this.client.utils.fetch<{ level: number; expRequired: number }[]>(
                        'https://shooting-star-unique-api.vercel.app/api/mwl/levels'
                    )
                    const expArr = pokemonLevelCharts.filter((x) => x.level <= level)
                    const exp = expArr[expArr.length - 1].expRequired
                    const image = data.sprites.other['official-artwork'].front_default as string
                    const { hp, attack, defense, speed } = await this.client.utils.getPokemonStats(data.id, level)
                    const { moves, rejectedMoves } = await this.client.utils.assignPokemonMoves(data.name, level)
                    const client = new PokemonClient()
                    const { gender_rate } = await client.getPokemonSpeciesByName(data.name)
                    let female = false
                    if (gender_rate >= 8) female = true
                    if (gender_rate < 8 && gender_rate > 0)
                        female = this.genders[Math.floor(Math.random() * this.genders.length)] === 'female'
                    this.pokemonResponse.set(this.wild[i], {
                        name: data.name,
                        level,
                        exp,
                        image,
                        id,
                        displayExp: 0,
                        hp,
                        attack,
                        defense,
                        speed,
                        maxHp: hp,
                        maxDefense: defense,
                        maxAttack: attack,
                        maxSpeed: speed,
                        types: data.types.map((type) => type.type.name),
                        moves,
                        rejectedMoves,
                        state: {
                            status: '',
                            movesUsed: 0
                        },
                        female,
                        tag: this.client.utils.generateRandomUniqueTag(10)
                    })
                    const buffer = await this.client.utils.getBuffer(image)
                    await this.client.sendMessage(this.wild[i], {
                        image: buffer,
                        jpegThumbnail: buffer.toString('base64'),
                        caption: `A wild Pokemon appeared! Use *${this.client.config.prefix}catch <pokemon_name>* to catch this pokemon`
                    })
                }, (i + 1) * 45 * 1000)
            }
        })
    }

    public summonCard = async (jid: string, id: string): Promise<void> => {
        const url = `https://shoob.gg/cards/info/${id}`
        return await this.client.utils
            .fetch<string>(`https://scrap-shoob.herokuapp.com/scrap?id=${id}`)
            .then(async (data) => {
                const valid = this.client.utils.validateCard(data)
                if (!valid)
                    return void (await this.client.sendMessage(jid, {
                        text: 'Invalid Card ID'
                    }))
                const { name, image, description, tier } = this.client.utils.scrapCardData(data)
                const price =
                    tier === '1'
                        ? Math.floor(Math.random() * (1000 - 650) + 650)
                        : tier === '2'
                        ? Math.floor(Math.random() * (1850 - 1110) + 1110)
                        : tier === '3'
                        ? Math.floor(Math.random() * (3400 - 2300) + 3400)
                        : tier === '4'
                        ? Math.floor(Math.random() * (5400 - 4100) + 4100)
                        : tier === '5'
                        ? Math.floor(Math.random() * (9800 - 7100) + 7100)
                        : tier === '6'
                        ? Math.floor(Math.random() * (24890 - 18350) + 18350)
                        : Math.floor(Math.random() * (54160 - 37980) + 37980)
                this.cardResponse.set(jid, {
                    name,
                    id,
                    tier,
                    image,
                    url,
                    price,
                    description
                })
                let buffer = await this.client.utils.getBuffer(image)
                let type: 'image' | 'video' = 'image'
                if (tier === '6' || tier === 'S') type = 'video'
                if (type === 'video') buffer = await this.client.utils.gifToMp4(buffer)
                const text = `🧧 *Details* 🧧\n\n🎈 *Name:* ${name}\n📘 *Description:* ${description}\n🎐 *Tier:* ${tier}\n🎏 *Price:* ${price}\n\nUse *${this.client.config.prefix}claim* to get this card for yourself.`
                const buttons = [
                    {
                        buttonId: 'id1',
                        buttonText: { displayText: `${this.client.config.prefix}claim` },
                        type: 1
                    }
                ]
                const buttonMessage = {
                    [type]: buffer,
                    caption:
                        tier !== 'S'
                            ? `🃏 A Collectable card Appeared! 🃏\n\n${text}`
                            : `🃏 Woahh! An S tier Card Appeared! 🃏\n\n${text}`,
                    footer: '',
                    buttons: buttons,
                    headerType: type === 'image' ? 4 : 5
                }
                await this.client.sendMessage(jid, buttonMessage as unknown as AnyMessageContent)
                if (!image.includes('eventcards')) {
                    await delay(3000)
                    await this.client.utils
                        .fetch<string>(`https://shooting-star-unique-api.vercel.app/api/mwl/insert?id=${id}`)
                        .catch((err) => this.client.log(err.message))
                }
            })
            .catch(async (err) => {
                return void (await this.client.sendMessage(jid, {
                    text: err.message
                }))
            })
    }

    public summonPokemon = async (
        jid: string,
        options: { pokemon: string | number; level?: number }
    ): Promise<void> => {
        const i = typeof options.pokemon === 'string' ? options.pokemon.toLowerCase() : options.pokemon.toString()
        const level = options.level ? options.level : Math.floor(Math.random() * (30 - 15)) + 15
        const pokemonLevelCharts = await this.client.utils.fetch<{ level: number; expRequired: number }[]>(
            'https://shooting-star-unique-api.vercel.app/api/mwl/levels'
        )
        const expArr = pokemonLevelCharts.filter((x) => x.level <= level)
        const { expRequired: exp } = expArr[expArr.length - 1]
        const data = await this.client.utils.fetch<IPokemonAPIResponse>(`https://pokeapi.co/api/v2/pokemon/${i}`)
        if (!data.name)
            return void (await this.client.sendMessage(jid, {
                text: 'Invalid Pokemon name or ID'
            }))
        const image = data.sprites.other['official-artwork'].front_default as string
        const { hp, attack, defense, speed } = await this.client.utils.getPokemonStats(data.id, level)
        const { moves, rejectedMoves } = await this.client.utils.assignPokemonMoves(data.name, level)
        const client = new PokemonClient()
        const { gender_rate } = await client.getPokemonSpeciesByName(data.name)
        let female = false
        if (gender_rate >= 8) female = true
        if (gender_rate < 8 && gender_rate > 0)
            female = this.genders[Math.floor(Math.random() * this.genders.length)] === 'female'
        this.pokemonResponse.set(jid, {
            name: data.name,
            level,
            exp,
            image,
            id: data.id,
            displayExp: 0,
            hp,
            attack,
            defense,
            speed,
            maxHp: hp,
            maxDefense: defense,
            maxAttack: attack,
            maxSpeed: speed,
            types: data.types.map((type) => type.type.name),
            moves,
            rejectedMoves,
            state: {
                status: '',
                movesUsed: 0
            },
            female,
            tag: this.client.utils.generateRandomUniqueTag(10)
        })
        const buffer = await this.client.utils.getBuffer(image)
        return void (await this.client.sendMessage(jid, {
            image: buffer,
            jpegThumbnail: buffer.toString('base64'),
            caption: `A wild Pokemon appeared! Use *${this.client.config.prefix}catch <pokemon_name>* to catch this pokemon`
        }))
    }

    public summonHaigusha = async (jid: string, slug: string): Promise<void> => {
        await this.client.utils
            .fetch<WaifuResponse>(`https://shooting-star-unique-api.vercel.app/api/mwl/character/slug/${slug}`)
            .then(async (haigusha) => {
                const appearances = haigusha.appearances as WaifuResponse['series'][]
                this.haigushaResponse.set(jid, haigusha)
                let text = `🎐 *Name:* ${haigusha.name}\n\n🎗 *Original Name:* ${haigusha.original_name}\n\n`
                if (haigusha.age && haigusha.age !== null) text += `🍀 *Age:* ${haigusha.age}\n\n`
                text += `🎀 *Gender:* ${haigusha.husbando ? 'Male' : 'Female'}\n\n🔗 *Appearance:* ${
                    haigusha.series !== null || haigusha.series ? haigusha.series?.name : appearances[0]?.name
                }\n\n❄ *Description:* ${haigusha.description}`
                const buttons = [
                    {
                        buttonId: 'id1',
                        buttonText: { displayText: `${this.client.config.prefix}marry` },
                        type: 1
                    }
                ]
                const buffer = await this.client.utils.getBuffer(haigusha.display_picture as string)
                const buttonMessage = {
                    image: buffer,
                    jpegThumbnail: buffer.toString('base64'),
                    caption: text,
                    footer: '',
                    buttons: buttons,
                    headerType: 4,
                    contextInfo: {
                        externalAdReply: {
                            title: haigusha.name,
                            mediaType: 1,
                            thumbnail: buffer,
                            sourceUrl: `https://mywaifulist.moe/waifu/${slug}`
                        }
                    }
                }
                await this.client.sendMessage(jid, buttonMessage as unknown as AnyMessageContent)
            })
            .catch(() => {
                return void null
            })
    }

    private spawnCard = async (): Promise<void> => {
        schedule('*/19 * * * *', async () => {
            if (this.card.length < 1) return void null
            for (let i = 0; i < this.card.length; i++) {
                setTimeout(async () => {
                    const { cards, bot } = await this.client.DB.getGroup(this.card[i])
                    if (bot !== 'all' && bot !== this.client.config.name.split(' ')[0]) return void null
                    if (!cards) return void null
                    const id = await this.client.utils.fetch<string>(
                        'https://shooting-star-unique-api.vercel.app/api/mwl/random/card'
                    )
                    const url = `https://shoob.gg/cards/info/${id}`
                    await this.client.utils
                        .fetch<string>(`https://scrap-shoob.herokuapp.com/scrap?id=${id}`)
                        .then(async (data) => {
                            const { name, image, description, tier } = this.client.utils.scrapCardData(data)
                            const price =
                                tier === '1'
                                    ? Math.floor(Math.random() * (1000 - 650) + 650)
                                    : tier === '2'
                                    ? Math.floor(Math.random() * (1850 - 1110) + 1110)
                                    : tier === '3'
                                    ? Math.floor(Math.random() * (3400 - 2300) + 3400)
                                    : tier === '4'
                                    ? Math.floor(Math.random() * (5400 - 4100) + 4100)
                                    : tier === '5'
                                    ? Math.floor(Math.random() * (9800 - 7100) + 7100)
                                    : tier === '6'
                                    ? Math.floor(Math.random() * (24890 - 18350) + 18350)
                                    : Math.floor(Math.random() * (54160 - 37980) + 37980)
                            this.cardResponse.set(this.card[i], {
                                name,
                                id,
                                tier,
                                image,
                                url,
                                price,
                                description
                            })
                            let buffer = await this.client.utils.getBuffer(image)
                            let type: 'image' | 'video' = 'image'
                            if (tier === '6' || tier === 'S') type = 'video'
                            if (type === 'video') buffer = await this.client.utils.gifToMp4(buffer)
                            const text = `🧧 *Details* 🧧\n\n🎈 *Name:* ${name}\n📘 *Description:* ${description}\n🎐 *Tier:* ${tier}\n🎏 *Price:* ${price}\n\nUse *${this.client.config.prefix}claim* to get this card for yourself.`
                            const buttons = [
                                {
                                    buttonId: 'id1',
                                    buttonText: { displayText: `${this.client.config.prefix}claim` },
                                    type: 1
                                }
                            ]
                            const buttonMessage = {
                                [type]: buffer,
                                caption:
                                    tier !== 'S'
                                        ? `🃏 A Collectable card Appeared! 🃏\n\n${text}`
                                        : `🃏 Woahh! An S tier Card Appeared! 🃏\n\n${text}`,
                                footer: '',
                                buttons: buttons,
                                headerType: type === 'image' ? 4 : 5
                            }
                            await this.client.sendMessage(this.card[i], buttonMessage as unknown as AnyMessageContent)
                        })
                        .catch(() => {
                            return void null
                        })
                }, (i + 1) * 48 * 1000)
            }
        })
    }

    public handleMessage = async (M: Message): Promise<void> => {
        const { prefix } = this.client.config
        const args = M.content.split(' ')
        const title = M.chat === 'dm' ? 'DM' : M.groupMetadata?.subject || 'Group'
        await this.moderate(M)
        if (!args[0] || !args[0].startsWith(prefix))
            return void this.client.log(
                `${chalk.cyanBright('Message')} from ${chalk.yellowBright(M.sender.username)} in ${chalk.blueBright(
                    title
                )}`
            )
        this.client.log(
            `${chalk.cyanBright(`Command ${args[0]}[${args.length - 1}]`)} from ${chalk.yellowBright(
                M.sender.username
            )} in ${chalk.blueBright(title)}`
        )
        const { bot } = await this.client.DB.getGroup(M.from)
        const commands = ['switch', 'hello', 'hi']
        const { ban, tag, inventory, companion } = await this.client.DB.getUser(M.sender.jid)
        if (!tag)
            await this.client.DB.updateUser(M.sender.jid, 'tag', 'set', this.client.utils.generateRandomUniqueTag())
        const cmd = args[0].toLowerCase().slice(prefix.length)
        if (bot != this.client.config.name.split(' ')[0] && bot !== 'all' && !commands.includes(cmd)) return void null
        if (ban.banned)
            return void M.reply(
                `You are banned from using commands. Banned by *${ban.bannedBy}* at *${ban.bannedIn}* in *${ban.time} (GMT)*. ❓ Reason: *${ban.reason}*`
            )
        const command = this.commands.get(cmd) || this.aliases.get(cmd)
        if (!command) return void M.reply('No such command, Baka!')
        const disabledCommands = await this.client.DB.getDisabledCommands()
        const index = disabledCommands.findIndex((CMD) => CMD.command === command.name)
        if (index >= 0)
            return void M.reply(
                `💈 *${this.client.utils.capitalize(cmd)}* is currently disabled by *${
                    disabledCommands[index].deniedBy
                }* in *${disabledCommands[index].time} (GMT)*. 🎈 Reason: *${disabledCommands[index].reason}*`
            )
        if (M.chat === 'dm' && !command.config.dm) return void M.reply('You can use this command only in groups')
        if (command.config.category === 'moderation' && !M.sender.isAdmin)
            return void M.reply('This command can only be used by the group admins')
        if (command.config.antiTrade && this.userTradeSet.has(M.sender.jid))
            return void M.reply("You can't use this command right now as you created an ongoing card trade")
        if (command.config.category === 'pokemon' && companion === 'None' && command.name !== 'start-journey') {
            const Buttons = [
                {
                    buttonId: 'id1',
                    buttonText: { displayText: `${this.client.config.prefix}start-journey` },
                    type: 1
                }
            ]
            const text = `You haven't started your Pokemon journey yet. Use *${this.client.config.prefix}start-journey* to start`
            const ButtonMessage = {
                text,
                footer: '',
                buttons: Buttons,
                headerType: 1
            }
            return void (await this.client.sendMessage(M.from, ButtonMessage, {
                quoted: M.message
            }))
        }
        if (command.config.category === 'nsfw' && !(await this.client.DB.getGroup(M.from)).nsfw)
            return void M.reply("Don't be a pervert, Baka! This comand can only be used in NSFW enabled groups")
        if (command.config.category === 'dev' && !M.sender.isMod)
            return void M.reply('This command can only be used by the MODS')
        if (command.config.casino && M.from !== this.client.config.casinoGroup)
            return void M.reply(
                `This command can only be used in the casino group. Use ${this.client.config.prefix}support to get the casino group link`
            )
        const isAdmin = M.groupMetadata?.admins?.includes(this.client.correctJid(this.client.user?.id || ''))
        if (command.config.adminRequired && !isAdmin) return void M.reply('I need to be an admin to use this command')
        if (command.config.antiBattle && this.pokemonBattlePlayerMap.has(M.sender.jid))
            return void M.reply("You can't use this command now as you're in the midway of a battle with someone")
        const cooldownAmount = (command.config.cooldown ?? 3) * 1000
        const time = cooldownAmount + Date.now()
        if (this.cooldowns.has(`${M.sender.jid}${command.name}`)) {
            const cd = this.cooldowns.get(`${M.sender.jid}${command.name}`)
            const remainingTime = this.client.utils.convertMs((cd as number) - Date.now())
            return void M.reply(
                `Woahh! Slow down. You can use this command again in *${remainingTime}* ${
                    remainingTime > 1 ? 'seconds' : 'second'
                }`
            )
        } else this.cooldowns.set(`${M.sender.jid}${command.name}`, time)
        setTimeout(() => this.cooldowns.delete(`${M.sender.jid}${command.name}`), cooldownAmount)
        let exp = command.config.exp ?? 10
        if (inventory.findIndex((x) => x.item === 'experience charm') > -1) exp = exp * 2
        await this.client.DB.setExp(M.sender.jid, exp)
        let gold = Math.floor(Math.random() * 75)
        if (inventory.findIndex((x) => x.item === 'gold charm') > -1) gold = gold * 2
        await this.client.DB.setGold(M.sender.jid, gold)
        await this.handleUserStats(M)
        try {
            await command.execute(M, this.formatArgs(args))
        } catch (error) {
            this.client.log((error as any).message, true)
        }
    }

    public pokemonEvolutionResponse = new Map<string, { group: string; pokemon: string }>()

    public loadWildEnabledGroups = async (): Promise<void> => {
        const groups = !this.groups ? await this.client.getAllGroups() : this.groups
        for (const group of groups) {
            const data = await this.client.DB.getGroup(group)
            if (!data.wild) continue
            this.wild.push(group)
        }
        this.client.log(
            `Successfully loaded ${chalk.blueBright(`${this.wild.length}`)} ${
                this.card.length > 1 ? 'groups' : 'group'
            } which has enabled wild`
        )
        await this.spawnPokemon()
    }

    public loadCardsEnabledGroups = async (): Promise<void> => {
        const groups = !this.groups ? await this.client.getAllGroups() : this.groups
        for (const group of groups) {
            const data = await this.client.DB.getGroup(group)
            if (!data.cards) continue
            this.card.push(group)
        }
        this.client.log(
            `Successfully loaded ${chalk.blueBright(`${this.card.length}`)} ${
                this.card.length > 1 ? 'groups' : 'group'
            } which has enabled cards`
        )
        await this.spawnCard()
    }

    private moderate = async (M: Message): Promise<void> => {
        if (M.chat !== 'group') {
            const urls = M.urls
            if (!urls.length) return void null
            const groupinvites = urls.filter((url) => url.includes('chat.whatsapp.com'))
            if (!groupinvites.length) return void null
            this.client.log(
                `${chalk.blueBright('GROUP REQUEST')} from ${chalk.yellowBright(
                    M.sender.username
                )} in ${chalk.cyanBright('DM')}`
            )
            const text = `Request from *@${M.sender.jid.split('@')[0]}*\n\n${M.content}`
            if (M.message.key.fromMe) return void null
            await this.client.sendMessage(this.client.config.adminsGroup, {
                text,
                mentions: [M.sender.jid]
            })
            return void M.reply('Your request has been sent')
        }
        const { mods } = await this.client.DB.getGroup(M.from)
        if (
            !mods ||
            M.sender.isAdmin ||
            !M.groupMetadata?.admins?.includes(this.client.correctJid(this.client.user?.id || ''))
        )
            return void null
        const urls = M.urls
        if (urls.length > 0) {
            const groupinvites = urls.filter((url) => url.includes('chat.whatsapp.com'))
            if (groupinvites.length > 0) {
                groupinvites.forEach(async (invite) => {
                    const code = await this.client.groupInviteCode(M.from)
                    const inviteSplit = invite.split('/')
                    if (inviteSplit[inviteSplit.length - 1] !== code) {
                        const title = M.groupMetadata?.subject || 'Group'
                        this.client.log(
                            `${chalk.blueBright('MOD')} ${chalk.green('Group Invite')} by ${chalk.yellow(
                                M.sender.username
                            )} in ${chalk.cyanBright(title)}`
                        )
                        return void (await this.client.groupParticipantsUpdate(M.from, [M.sender.jid], 'remove'))
                    }
                })
            }
        }
    }

    public news: string[] = []

    private formatArgs = (args: string[]): IArgs => {
        args.splice(0, 1)
        return {
            args,
            context: args.join(' ').trim(),
            flags: args.filter((arg) => arg.startsWith('--'))
        }
    }

    public loadCommands = (): void => {
        this.client.log('Loading Commands...')
        const files = readdirSync(join(...this.path)).filter((file) => !file.startsWith('_'))
        for (const file of files) {
            this.path.push(file)
            const Commands = readdirSync(join(...this.path))
            for (const Command of Commands) {
                this.path.push(Command)
                const command: BaseCommand = new (require(join(...this.path)).default)()
                command.client = this.client
                command.handler = this
                this.commands.set(command.name, command)
                if (command.config.aliases) command.config.aliases.forEach((alias) => this.aliases.set(alias, command))
                this.client.log(
                    `Loaded: ${chalk.yellowBright(command.name)} from ${chalk.cyanBright(command.config.category)}`
                )
                this.path.splice(this.path.indexOf(Command), 1)
            }
            this.path.splice(this.path.indexOf(file), 1)
        }
        return this.client.log(
            `Successfully loaded ${chalk.cyanBright(this.commands.size)} ${
                this.commands.size > 1 ? 'commands' : 'command'
            } with ${chalk.yellowBright(this.aliases.size)} ${this.aliases.size > 1 ? 'aliases' : 'alias'}`
        )
    }

    private handleUserStats = async (M: Message): Promise<void> => {
        const { experience, level } = await this.client.DB.getUser(M.sender.jid)
        const { requiredXpToLevelUp } = getStats(level)
        if (requiredXpToLevelUp > experience) return void null
        await this.client.DB.updateUser(M.sender.jid, 'level', 'inc', 1)
    }

    public handlePokemonStats = async (
        M: Message,
        pkmn: Pokemon,
        inBattle: boolean,
        player: 'player1' | 'player2',
        user: string
    ): Promise<void> => {
        const learnableMove = await this.client.utils.getPokemonLearnableMove(
            pkmn.name,
            pkmn.level,
            pkmn.moves,
            pkmn.rejectedMoves
        )
        const jid = user
        await this.client.sendMessage(M.from, {
            mentions: [jid],
            text: `*@${jid.split('@')[0]}*'s ${this.client.utils.capitalize(pkmn.name)} grew to Level ${pkmn.level}`
        })
        await delay(2500)
        if (!learnableMove) return await this.handlePokemonEvolution(M, pkmn, inBattle, player, user)
        const { party } = await this.client.DB.getUser(jid)
        const i = party.findIndex((x) => x.tag === pkmn.tag)
        const { hp, speed, defense, attack } = await this.client.utils.getPokemonStats(pkmn.id, pkmn.level)
        pkmn.hp += hp - pkmn.maxHp
        pkmn.speed += speed - pkmn.speed
        pkmn.defense += defense - pkmn.defense
        pkmn.attack += attack - pkmn.attack
        pkmn.maxAttack = attack
        pkmn.maxSpeed = speed
        pkmn.maxHp = hp
        pkmn.maxDefense = defense
        party[i] = pkmn
        await this.client.DB.user.updateOne({ jid }, { $set: { party } })
        if (inBattle) {
            const data = this.pokemonBattleResponse.get(M.from)
            if (data && data[player].activePokemon.tag === pkmn.tag) {
                data[player].activePokemon = pkmn
                this.pokemonBattleResponse.set(M.from, data)
            }
        }
        const move = learnableMove.name
            .split('-')
            .map((move) => this.client.utils.capitalize(move))
            .join(' ')
        if (pkmn.moves.length < 4) {
            pkmn.moves.push(learnableMove)
            party[i] = pkmn
            if (inBattle) {
                const data = this.pokemonBattleResponse.get(M.from)
                if (data && data[player].activePokemon.tag === pkmn.tag) {
                    data[player].activePokemon = pkmn
                    this.pokemonBattleResponse.set(M.from, data)
                }
            }
            await this.client.DB.user.updateOne({ jid }, { $set: { party } })
            await this.client.sendMessage(M.from, {
                text: `*@${jid.split('@')[0]}*'s *${this.client.utils.capitalize(pkmn.name)}* learnt *${move}*`,
                mentions: [jid]
            })
            await delay(3000)
            return await this.handlePokemonEvolution(M, pkmn, inBattle, player, user)
        } else {
            const sections: proto.Message.ListMessage.ISection[] = []
            const rows: proto.Message.ListMessage.IRow[] = []
            for (const move of pkmn.moves) {
                rows.push({
                    title: `Delete ${move.name
                        .split('-')
                        .map((name) => this.client.utils.capitalize(name))
                        .join(' ')}`,
                    rowId: `${this.client.config.prefix}learn --${move.name}`,
                    description: `Type: ${this.client.utils.capitalize(move.type)} | PP: ${move.maxPp} | Power: ${
                        move.power
                    } | Accuracy: ${move.accuracy}`
                })
            }
            sections.push({ title: `${this.client.utils.capitalize(pkmn.name)} Moves`, rows })
            const Rows: proto.Message.ListMessage.IRow[] = [
                {
                    title: 'Cancel',
                    rowId: `${this.client.config.prefix}learn --cancel`,
                    description: `Type: ${this.client.utils.capitalize(learnableMove.type)} | PP: ${
                        learnableMove.maxPp
                    } | Power: ${learnableMove.power} | Accuracy: ${learnableMove.accuracy}`
                }
            ]
            sections.push({ title: 'Cancel Learning', rows: Rows })
            this.pokemonMoveLearningResponse.set(`${M.from}${jid}`, {
                move: learnableMove,
                data: pkmn
            })
            const text = `*@${jid.split('@')[0]}*, your Pokemon *${this.client.utils.capitalize(
                pkmn.name
            )}* is trying to learn *${move}*.\nBut a Pokemon can't learn more than 4 moves.\nDelete a move to learn this move by selecting one of the moves below.\n\n*[This will autometically be cancelled if you don't continue within 60 seconds]*`
            await this.client.sendMessage(M.from, {
                text,
                mentions: [jid],
                sections,
                buttonText: `${this.client.utils.capitalize(pkmn.name)} Moves`
            })
            await delay(1500)
            await this.client.sendMessage(M.from, {
                text: `📝 *Move Details*\n\n❓ *Move:* ${move}\n〽 *PP:* ${
                    learnableMove.maxPp
                }\n🎗 *Type:* ${this.client.utils.capitalize(learnableMove.type)}\n🎃 *Power:* ${
                    learnableMove.power
                }\n🎐 *Accuracy:* ${learnableMove.accuracy}\n🧧 *Description:* ${learnableMove.description}`
            })
            setTimeout(async () => {
                if (this.pokemonMoveLearningResponse.has(`${M.from}${jid}`)) {
                    this.pokemonMoveLearningResponse.delete(`${M.from}${jid}`)
                    party[i].rejectedMoves.push(learnableMove.name)
                    await this.client.DB.user.updateOne({ jid }, { $set: { party } })
                    await this.client.sendMessage(M.from, {
                        text: `*@${jid.split('@')[0]}*'s *${this.client.utils.capitalize(
                            pkmn.name
                        )}* Cancelled learning *${move}*`,
                        mentions: [jid]
                    })
                }
                return await this.handlePokemonEvolution(M, pkmn, inBattle, player, user)
            }, 6 * 10000)
        }
    }

    private handlePokemonEvolution = async (
        M: Message,
        pkmn: Pokemon,
        inBattle: boolean,
        player: 'player1' | 'player2',
        user: string
    ): Promise<void> => {
        const evolutions = await this.client.utils.getPokemonEvolutionChain(pkmn.name)
        if (evolutions.length < 1) return void null
        const pokemonEvolutionChain = await this.client.utils.fetch<IPokemonEvolutionChain[]>(
            'https://shooting-star-unique-api.vercel.app/api/mwl/chain'
        )
        const chain = pokemonEvolutionChain.filter((x) => evolutions.includes(x.species_name))
        if (chain.length < 1) return void null
        const index = evolutions.findIndex((x) => x === pkmn.name) + 1
        if (!evolutions[index]) return void null
        const chainIndex = chain.findIndex((x) => x.species_name === evolutions[index])
        if (chainIndex < 0) return void null
        const pokemn = chain[chainIndex]
        if (pokemn.trigger_name !== 'level-up') return void null
        if (pokemn.min_level > pkmn.level) return void null
        if (this.pokemonEvolutionResponse.has(`${pkmn.name}${user}`)) return void null
        const text = `*${user.split('@')[0]}*, your Pokemon *${this.client.utils.capitalize(
            pkmn.name
        )}* is evolving to *${this.client.utils.capitalize(evolutions[index])}*. Use *${
            this.client.config.prefix
        }cancel-evolution* to cancel this evolution (within 60s)`
        const { party } = await this.client.DB.getUser(M.sender.jid)
        const i = party.findIndex((x) => x.tag === pkmn.tag)
        const Buttons = [
            {
                buttonId: 'id1',
                buttonText: { displayText: `${this.client.config.prefix}cancel-evolution` },
                type: 1
            }
        ]
        const ButtonMessage = {
            text,
            footer: '',
            buttons: Buttons,
            headerType: 1,
            mentions: [user]
        }
        await this.client.sendMessage(M.from, ButtonMessage)
        this.pokemonEvolutionResponse.set(user, {
            group: M.from,
            pokemon: pkmn.name
        })
        setTimeout(async () => {
            if (!this.pokemonEvolutionResponse.has(M.sender.jid)) return void null
            this.pokemonEvolutionResponse.delete(M.sender.jid)
            const pData = await this.client.utils.fetch<IPokemonAPIResponse>(
                `https://pokeapi.co/api/v2/pokemon/${evolutions[index]}`
            )
            pkmn.id = pData.id
            pkmn.image = pData.sprites.other['official-artwork'].front_default as string
            pkmn.name = pData.name
            const { hp, attack, defense, speed } = await this.client.utils.getPokemonStats(pkmn.id, pkmn.level)
            pkmn.hp += hp - pkmn.maxHp
            pkmn.speed += speed - pkmn.speed
            pkmn.defense += defense - pkmn.defense
            pkmn.attack += attack - pkmn.attack
            pkmn.maxAttack = attack
            pkmn.maxSpeed = speed
            pkmn.maxHp = hp
            pkmn.maxDefense = defense
            if (pkmn.tag === '0')
                await this.client.DB.user.updateOne({ jid: user }, { $set: { companion: pData.name } })
            party[i] = pkmn
            if (inBattle) {
                const data = this.pokemonBattleResponse.get(M.from)
                if (data && data[player].activePokemon.tag === pkmn.tag) {
                    data[player].activePokemon = pkmn
                    this.pokemonBattleResponse.set(M.from, data)
                }
            }
            await this.client.DB.user.updateOne({ jid: user }, { $set: { party } })
            const buffer = await this.client.utils.getBuffer(pkmn.image)
            return void (await this.client.sendMessage(M.from, {
                image: buffer,
                jpegThumbnail: buffer.toString('base64'),
                caption: `Congrats! *@${user.split('@')[0]}*, your ${this.client.utils.capitalize(
                    evolutions[index - 1]
                )} has been evolved to ${this.client.utils.capitalize(pkmn.name)}`,
                mentions: [user]
            }))
        }, 6 * 10000)
    }

    public commands = new Map<string, ICommand>()

    public aliases = new Map<string, ICommand>()

    private cooldowns = new Map<string, number>()

    private path = [__dirname, '..', 'Commands']

    public quiz = {
        game: new Map<string, { answer: string; options: string[] }>(),
        timer: new Map<string, { id: NodeJS.Timer }>(),
        board: new Map<string, { players: { jid: string; points: number }[] }>(),
        answered: new Map<string, { players: string[] }>(),
        forfeitable: new Map<string, boolean>()
    }

    public pokemonResponse = new Map<string, Pokemon>()

    public pokemonTradeResponse = new Map<string, { offer: Pokemon; creator: string; with: string }>()

    public cardResponse = new Map<
        string,
        {
            price: number
            name: string
            tier: TCardsTier
            id: string
            image: string
            url: string
            description: string
        }
    >()

    public pokemonMoveLearningResponse = new Map<string, { move: PokemonMove; data: Pokemon }>()

    public cardTradeResponse = new Map<
        string,
        { creator: string; offer: Card; index: number; with: { name: string; tier: TCardsTier } }
    >()

    public userTradeSet = new Set<string>()

    public haigushaResponse = new Map<string, WaifuResponse>()

    public pokemonBattleResponse = new Map<
        string,
        {
            player1: { user: string; ready: boolean; move: PokemonMove | 'skipped' | ''; activePokemon: Pokemon }
            player2: { user: string; ready: boolean; move: PokemonMove | 'skipped' | ''; activePokemon: Pokemon }
            turn: 'player1' | 'player2'
            players: string[]
        }
    >()

    public pokemonBattlePlayerMap = new Map<string, string>()

    public pokemonChallengeResponse = new Map<string, { challenger: string; challengee: string }>()

    private genders = ['female', 'male']
}

interface IPokemonEvolutionChain {
    species_name: string
    min_level: number
    trigger_name: 'level-up' | 'use-item' | null
    item: {
        name: string
        url: string
    } | null
}
