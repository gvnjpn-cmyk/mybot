import fetch from 'node-fetch';

const VEXOR_API = 'https://vexor-amber.vercel.app/api/downloader';
const VEXOR_KEY = 'VEXORXVIP-OWN';

const handler = async (m, plug) => {
    const { sock, chatId, reply, react, args, config, m: msg } = plug;

    if (!args) return reply(
`Format: ${config.prefix}dl <url>

Contoh:
${config.prefix}dl https://tiktok.com/...
${config.prefix}dl https://youtube.com/...
${config.prefix}dl https://instagram.com/...`
    );

    const parts   = args.trim().split(' ');
    const url     = parts[0];
    const quality = parts[1] || 'best';

    await react('⏳');

    try {
        const res  = await fetch(VEXOR_API, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': VEXOR_KEY },
            body:    JSON.stringify({ url, quality })
        });

        const data = await res.json();
        if (!data.ok) { await react('❌'); return reply(`❌ Gagal: ${data.message || 'Unknown error'}`); }

        const { title, thumb, videoUrl, audioUrl, duration, platform } = data;

        await reply(`⏳ Downloading *${title}*\nPlatform: ${platform}\nDuration: ${duration || '-'}`);

        if (videoUrl) {
            await sock.sendMessage(chatId, {
                video:   { url: videoUrl },
                caption: `*${title}*\n\n> ${config.namaBot}`,
                footer:  config.namaBot
            }, { quoted: msg });
        } else if (audioUrl) {
            await sock.sendMessage(chatId, {
                audio:    { url: audioUrl },
                mimetype: 'audio/mp4',
                ptt:      false
            }, { quoted: msg });
        }

        await react('✅');
    } catch (e) {
        await react('❌');
        await reply(`❌ Error: ${e.message}`);
    }
};

handler.command = ['dl', 'download', 'tiktok', 'yt'];
handler.tags    = ['tools'];
handler.limit   = true;

export default handler;
