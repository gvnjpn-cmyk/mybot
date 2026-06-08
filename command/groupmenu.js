const handler = async (m, plug) => {
    const { sock, config, chatId, m: msg } = plug;

    await sock.sendMessage(chatId, {
        image:   { url: config.menuImage },
        caption:
`✧ *GROUP* — 9 fitur

✦ Manage
┊ › ${config.prefix}kick      — kick member
┊ › ${config.prefix}add       — add member
┊ › ${config.prefix}promote   — jadikan admin
┊ › ${config.prefix}demote    — copot admin
┊ › ${config.prefix}hidetag   — tag semua
┊ › ${config.prefix}swgc      — update status grup

✦ Security
┊ › ${config.prefix}antilink  — on/off anti link

✦ Welcome
┊ › ${config.prefix}intro set — atur welcome
┊ › ${config.prefix}cn        — format CN`,
        footer: config.namaBot
    }, { quoted: msg });
};

handler.command = ['groupmenu', 'gmenu'];
handler.tags    = ['general'];
handler.limit   = false;

export default handler;
