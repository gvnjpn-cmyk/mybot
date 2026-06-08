import fs   from 'fs';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'data/antitagsw.json');

const readDB  = () => {
    if (!fs.existsSync(DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
};
const writeDB = (d) => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2));
};

const handler = async (m, plug) => {
    const { reply, isAdmin, isBotAdmin, chatId, config } = plug;

    const db   = readDB();
    const body = (plug.args || '').trim().toLowerCase();

    if (!body || !['on', 'off'].includes(body)) {
        return reply(
`💡 *Penggunaan:* ${config.prefix}antitagsw on/off

📌 *Status:* ${db[chatId] ? '✅ Aktif' : '❌ Nonaktif'}`
        );
    }

    db[chatId] = (body === 'on');
    writeDB(db);

    reply(body === 'on'
        ? '✅ Anti Tag SW aktif!\nMember yang tag massal/status akan otomatis dikick.'
        : '✅ Anti Tag SW dinonaktifkan!'
    );
};

export const checkAntiTagSW = async (m, plug) => {
    const { sock, chatId, senderJid, isAdmin, isBotAdmin } = plug;
    if (!isBotAdmin || isAdmin) return;

    const db = readDB();
    if (!db[chatId]) return;

    const isTagSW = !!m.message?.groupStatusMentionMessage;
    if (!isTagSW) return;

    try {
        await sock.sendMessage(chatId, { delete: m.key });
        await sock.sendMessage(chatId, {
            text: `⛔ @${senderJid.split('@')[0]} dikeluarkan karena melakukan tag massal/status!`,
            mentions: [senderJid]
        });
        await sock.groupParticipantsUpdate(chatId, [senderJid], 'remove');
    } catch (e) {
        console.error('[ANTITAGSW]', e.message);
    }
};

handler.help    = ['antitagsw <on/off>'];
handler.tags    = ['group'];
handler.command = ['antitagsw'];
handler.group   = true;
handler.admin   = true;
handler.limit   = false;

export default handler;
