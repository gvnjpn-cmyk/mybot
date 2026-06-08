const handler = async (m, plug) => {
    const { sock, config, chatId, m: msg } = plug;

    await sock.sendMessage(chatId, {
        image:   { url: config.menuImage },
        caption:
`✧ *TOOLS* — 4 fitur

┊ › ${config.prefix}sticker  — buat stiker
┊ › ${config.prefix}dl       — download media
┊ › ${config.prefix}qr       — generate QR code
┊ › ${config.prefix}tr       — translate teks`,
        footer: config.namaBot
    }, { quoted: msg });
};

handler.command = ['tools'];
handler.tags    = ['general'];
handler.limit   = false;

export default handler;
