const startTime = Date.now();
const getRuntime = () => {
    const diff = Date.now() - startTime;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
};

const handler = async (m, plug) => {
    const { sock, config, chatId, senderJid, senderLid, isOwner, m: msg } = plug;

    const senderName = m.pushName || (senderLid || senderJid).replace(/@.+/, '');
    const tier       = isOwner ? 'owner' : 'free user';

    await sock.sendMessage(chatId, {
        image:   { url: config.menuImage },
        caption:
`✦ *BOT DETAIL*
┊ name    : ${config.namaBot}
┊ mode    : public
┊ prefix  : ${config.prefix}
┊ runtime : ${getRuntime()}

✦ *USER DETAIL*
┊ name   : ${senderName}
┊ status : ${tier}
┊ limit  : ${isOwner ? 'unlimited' : `${config.limit.maxDaily}/day`}

✦ *MENU CATEGORY*
┊ › general  : 5 fitur
┊ › tools    : 4 fitur
┊ › ai       : 2 fitur
┊ › group    : 9 fitur
┊ › owner    : 6 fitur`,
        footer: `${config.namaBot} · Prefix: ${config.prefix}`,
        nativeFlow: [
            { text: 'All Menu',  id: `${config.prefix}allmenu`   },
            { text: 'Owner WA',  url: `https://wa.me/${config.owner}`, useWebview: true }
        ]
    }, { quoted: msg });
};

handler.command = ['info', 'about'];
handler.tags    = ['general'];
handler.limit   = false;

export default handler;
