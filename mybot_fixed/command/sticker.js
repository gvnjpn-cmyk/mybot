import fetch from 'node-fetch';
import { downloadMediaMessage } from '@itsliaaa/baileys';

const VEXOR_API = 'https://vexor-amber.vercel.app/api/sticker';
const VEXOR_KEY = 'VEXORXVIP-OWN';

const handler = async (m, plug) => {
    const { sock, chatId, reply, react, config, m: msg } = plug;

    const quotedCtx  = m.message?.extendedTextMessage?.contextInfo;
    const quotedMsg  = quotedCtx?.quotedMessage || null;
    const quotedMime = quotedMsg ? (Object.values(quotedMsg)[0]?.mimetype || '') : '';

    if (!quotedMsg || !(/image|video|gif/.test(quotedMime))) {
        return reply(`Reply gambar/gif dulu ya!\nContoh: reply gambar lalu ketik ${config.prefix}sticker`);
    }

    await react('⏳');

    try {
        const quotedKey = {
            remoteJid:   chatId,
            id:          quotedCtx?.stanzaId,
            participant: quotedCtx?.participant
        };

        const buffer  = await downloadMediaMessage(
            { key: quotedKey, message: quotedMsg },
            'buffer', {},
            { reuploadRequest: sock.updateMediaMessage }
        );

        const base64  = buffer.toString('base64');
        const mime    = quotedMime.split(';')[0];
        const dataUrl = `data:${mime};base64,${base64}`;

        const res  = await fetch(VEXOR_API, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': VEXOR_KEY },
            body:    JSON.stringify({ url: dataUrl, packname: config.namaBot, author: config.namaOwner })
        });

        const data = await res.json();
        if (!data.ok) { await react('❌'); return reply(`❌ Gagal: ${data.message || 'Unknown error'}`); }

        const stickerBuffer = Buffer.from(data.stickerBase64 || data.buffer, 'base64');

        await sock.sendMessage(chatId, { sticker: stickerBuffer }, { quoted: msg });
        await react('✅');
    } catch (e) {
        await react('❌');
        await reply(`❌ Error: ${e.message}`);
    }
};

handler.command = ['sticker', 's'];
handler.tags    = ['tools'];
handler.limit   = true;

export default handler;
