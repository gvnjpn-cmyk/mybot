const handler = async (m, plug) => {
    const { sock, config, chatId, senderJid, senderLid, m: msg } = plug;

    const senderNum = (senderLid || senderJid).replace(/@.+/, '');
    const mentions  = [senderLid || senderJid];

    await sock.sendMessage(chatId, {
        image:    { url: config.menuImage },
        caption:
`I am an automated system designed to assist you 24/7.
Whatever you need — just ask.

Hey, @${senderNum}. Choose a category below to get started.`,
        footer:   `${config.namaBot} · Prefix: ${config.prefix}`,
        mentions,
        optionText:  'Select Menu',
        optionTitle: 'Select Menu',
        nativeFlow: [
            { text: '≡  Select Menu', id: `${config.prefix}allmenu`  },
            { text: 'ℹ  Info',        id: `${config.prefix}info`     },
            { text: 'Owner WA',       url: `https://wa.me/${config.owner}`, useWebview: true }
        ]
    }, { quoted: msg });
};

handler.command = ['menu', 'start', 'help'];
handler.tags    = ['general'];
handler.limit   = false;

export default handler;
