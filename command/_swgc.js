import { generateWAMessageContent, generateWAMessageFromContent, downloadMediaMessage } from '@itsliaaa/baileys';
import crypto from 'node:crypto';

const groupStatus = async (sock, jid, content) => {
    const { backgroundColor } = content;
    delete content.backgroundColor;

    const inside = await generateWAMessageContent(content, {
        upload: sock.waUploadToServer,
        backgroundColor
    });

    const messageSecret = crypto.randomBytes(32);

    const m = generateWAMessageFromContent(
        jid,
        {
            messageContextInfo: { messageSecret },
            groupStatusMessageV2: {
                message: {
                    ...inside,
                    messageContextInfo: { messageSecret }
                }
            }
        },
        {}
    );

    await sock.relayMessage(jid, m.message, { messageId: m.key.id });
    return m;
};

const handler = async (m, plug) => {
    const { sock, chatId, reply, config, command } = plug;

    const quotedCtx  = m.message?.extendedTextMessage?.contextInfo;
    const quotedMsg  = quotedCtx?.quotedMessage || null;
    const quotedKey  = {
        remoteJid:   chatId,
        id:          quotedCtx?.stanzaId,
        participant: quotedCtx?.participant
    };

    const quotedMime = quotedMsg
        ? (Object.values(quotedMsg)[0]?.mimetype || '')
        : '';

    const rawBody = m.message?.conversation
        || m.message?.extendedTextMessage?.text
        || '';
    const caption = rawBody.replace(new RegExp(`^\\${config.prefix}${command}\\s*`, 'i'), '').trim();

    if (!quotedMime && !caption) {
        return reply(`Reply media atau tambahkan teks.\nContoh: ${config.prefix}${command} (reply image/video/audio) Hai ini saya`);
    }

    try {
        let payload = {};

        if (/image/.test(quotedMime)) {
            const buffer = await downloadMediaMessage(
                { key: quotedKey, message: quotedMsg },
                'buffer',
                {},
                { reuploadRequest: sock.updateMediaMessage }
            );
            payload = { image: buffer, caption };
        } else if (/video/.test(quotedMime)) {
            const buffer = await downloadMediaMessage(
                { key: quotedKey, message: quotedMsg },
                'buffer',
                {},
                { reuploadRequest: sock.updateMediaMessage }
            );
            payload = { video: buffer, caption };
        } else if (/audio/.test(quotedMime)) {
            const buffer = await downloadMediaMessage(
                { key: quotedKey, message: quotedMsg },
                'buffer',
                {},
                { reuploadRequest: sock.updateMediaMessage }
            );
            payload = { audio: buffer, mimetype: 'audio/mp4' };
        } else if (caption) {
            payload = { text: caption };
        } else {
            return reply(`Reply media atau tambahkan teks.\nContoh: ${config.prefix}${command} (reply image/video/audio) Hai ini saya`);
        }

        await groupStatus(sock, chatId, payload);
    } catch (err) {
        await reply(`❌ Gagal: ${err.message}`);
    }
};

handler.command  = ['swgc', 'upswgc', 'swgrup'];
handler.tags     = ['group'];
handler.group    = true;
handler.admin    = true;
handler.botAdmin = true;
handler.limit    = false;

export default handler;

// re-enable setelah isBotAdmin fix di handler.js
