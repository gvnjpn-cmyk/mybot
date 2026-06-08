import fetch from 'node-fetch';

const handler = async (m, plug) => {
    const { sock, chatId, reply, react, args, config, m: msg } = plug;

    if (!args) return reply(`Format: ${config.prefix}qr <teks/url>`);

    await react('⏳');

    try {
        const encoded = encodeURIComponent(args.trim());
        const url     = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encoded}`;

        await sock.sendMessage(chatId, {
            image:   { url },
            caption: `QR Code untuk:\n${args.trim()}`,
            footer:  config.namaBot
        }, { quoted: msg });

        await react('✅');
    } catch (e) {
        await react('❌');
        await reply(`❌ Error: ${e.message}`);
    }
};

handler.command = ['qr'];
handler.tags    = ['tools'];
handler.limit   = true;

export default handler;
