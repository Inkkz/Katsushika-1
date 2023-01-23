import { Command, BaseCommand, Message } from '../../Structures'
import { IArgs } from '../../Types'

@Command('exp', { 
    description: "Displays User's Exp ⭐",
    category: 'general',
    usage: `xp (@tag)`,
    aliases: ['xp'],
    exp: 50,
})
export default class extends BaseCommand {
    public override execute = async (M: Message): Promise<void> => {
    if (M.quoted?.sender.jid) M.mentioned.push(M.quoted.sender.jid);
    const user = M.mentioned[0] ? M.mentioned[0] : M.sender.jid;
    let username = user === M.sender.jid ? M.sender.username : "Your";
    if (!username) {
      // const contact = this.client.getContact(user)
      // username = contact.notify || contact.vname || contact.name || user.split('@')[0]
      username = user.split("@")[0];
    }
    return void (await M.reply(
      `*${username}'s Exp: ${(await this.client.DB.getUser(user)).experience || 0}*`
    ));
  };
}
