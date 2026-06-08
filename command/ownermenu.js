const handler = async (m, plug) => {
    const { sock, config, chatId, m: msg } = plug;

    await sock.sendMessage(chatId, {
        image:   { url: config.menuImage },
        caption:
`✧ *OWNER* — 6 fitur

✦ Broadcast
┊ › ${config.prefix}bc         — broadcast ke GC
┊ › ${config.prefix}listgc     — list semua GC

✦ System
┊ › ${config.prefix}maintenance — mode maintenance
┊ › ${config.prefix}addcmd      — tambah plugin

✦ Security
┊ › ${config.prefix}blacklist   — ban user
┊ › ${config.prefix}whitelist   — whitelist mode`,
        footer: config.namaBot
    }, { quoted: msg });
};

handler.command = ['ownermenu'];
handler.owner   = true;
handler.tags    = ['owner'];
handler.limit   = false;

export default handler;
