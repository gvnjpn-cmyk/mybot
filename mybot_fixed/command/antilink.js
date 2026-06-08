import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const DB_PATH    = path.resolve(process.cwd(), 'data/antilink.json');

const readDB  = () => {
    if (!fs.existsSync(DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
};
const writeDB = (d) => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2));
};

const LINK_REGEX = /(https?:\/\/|wa\.me|chat\.whatsapp\.com|bit\.ly|t\.me)[^\s]*/gi;

// ===== /antilink on|off =====
const handler = async (m, plug) => {
    const { reply, react, args, chatId, config } = plug;

    const db  = readDB();
    const sub = args?.toLowerCase()?.trim();

    if (!sub || sub === 'status') {
        return reply(`🔒 Antilink: *${db[chatId] ? 'ON' : 'OFF'}*\n\nGunakan:\n${config.prefix}antilink on\n${config.prefix}antilink off`);
    }

    if (sub === 'on') {
        db[chatId] = true;
        writeDB(db);
        await react('✅');
        return reply('✅ Antilink *ON* — link akan otomatis dihapus.');
    }

    if (sub === 'off') {
        delete db[chatId];
        writeDB(db);
        await react('✅');
        return reply('✅ Antilink *OFF*.');
    }
};

handler.command  = ['antilink'];
handler.tags     = ['group'];
handler.group    = true;
handler.admin    = true;
handler.limit    = false;

// ===== auto delete link checker (dipanggil dari handler.js) =====
export const checkAntilink = async (m, plug) => {
    const { sock, chatId, senderJid, senderLid, isAdmin, isOwner, isBotAdmin } = plug;
    if (!isBotAdmin || isAdmin || isOwner) return;

    const db = readDB();
    if (!db[chatId]) return;

    const text = m.message?.conversation
        || m.message?.extendedTextMessage?.text
        || m.message?.imageMessage?.caption
        || m.message?.videoMessage?.caption
        || '';

    if (!LINK_REGEX.test(text)) return;

    try {
        await sock.sendMessage(chatId, { delete: m.key });
        await sock.sendMessage(chatId, {
            text: `@${(senderLid || senderJid).replace(/@.+/, '')} dilarang kirim link di grup ini!`,
            mentions: [senderLid || senderJid]
        });
    } catch {}
};

export default handler;
