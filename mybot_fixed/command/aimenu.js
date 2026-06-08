const handler = async (m, plug) => {
    const { sock, config, chatId, m: msg } = plug;

    await sock.sendMessage(chatId, {
        image:   { url: config.menuImage },
        caption:
`✧ *AI* — 2 fitur

┊ › ${config.prefix}ai    — Chat with AI
┊ › ${config.prefix}flux  — Generate image`,
        footer: config.namaBot
    }, { quoted: msg });
};

handler.command = ['aimenu'];
handler.tags    = ['general'];
handler.limit   = false;

export default handler;
