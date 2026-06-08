import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const DB_PATH    = path.resolve(process.cwd(), 'data/security.json');

const readDB  = () => {
    if (!fs.existsSync(DB_PATH)) return { blacklist: [], whitelistMode: false, whitelist: [] };
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return { blacklist: [], whitelistMode: false, whitelist: [] }; }
};
const writeDB = (d) => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2));
};

export const isBlacklisted  = (jid) => readDB().blacklist.includes(jid);
export const isWhitelisted  = (jid) => readDB().whitelist.includes(jid);
export const isWhitelistMode = ()   => readDB().whitelistMode;

// ===== /blacklist =====
export const blacklist = async (m, plug) => {
    const { reply, react, args, config, m: msg } = plug;

    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
    const sub = args?.split(' ')[0]?.toLowerCase();

    const db = readDB();

    if (!sub || sub === 'list') {
        return reply(
`🚫 *Blacklist (${db.blacklist.length})*\n\n${db.blacklist.length ? db.blacklist.map(j => `› ${j}`).join('\n') : '_(kosong)_'}\n\nGunakan:\n${config.prefix}blacklist add @user\n${config.prefix}blacklist remove @user`
        );
    }

    const targets = mentioned.length ? mentioned : (quotedParticipant ? [quotedParticipant] : []);
    if (!targets.length) return reply(`Tag atau reply user.\nContoh: ${config.prefix}blacklist add @user`);

    if (sub === 'add') {
        targets.forEach(t => { if (!db.blacklist.includes(t)) db.blacklist.push(t); });
        writeDB(db);
        await react('✅');
        return reply(`✅ ${targets.length} user di-blacklist. Mereka tidak bisa pakai bot.`);
    }

    if (sub === 'remove') {
        db.blacklist = db.blacklist.filter(j => !targets.includes(j));
        writeDB(db);
        await react('✅');
        return reply(`✅ ${targets.length} user dihapus dari blacklist.`);
    }
};
blacklist.command = ['blacklist', 'bl'];
blacklist.owner   = true;
blacklist.limit   = false;

// ===== /whitelist =====
export const whitelist = async (m, plug) => {
    const { reply, react, args, config, m: msg } = plug;

    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
    const sub = args?.split(' ')[0]?.toLowerCase();

    const db = readDB();

    if (!sub || sub === 'status') {
        return reply(
`🔐 *Whitelist Mode: ${db.whitelistMode ? 'ON' : 'OFF'}*\nUser (${db.whitelist.length}): ${db.whitelist.length ? db.whitelist.map(j => `› ${j}`).join('\n') : '_(kosong)_'}\n\nGunakan:\n${config.prefix}whitelist on|off\n${config.prefix}whitelist add @user\n${config.prefix}whitelist remove @user`
        );
    }

    if (sub === 'on')  { db.whitelistMode = true;  writeDB(db); await react('✅'); return reply('✅ Whitelist mode ON — bot hanya respon user di whitelist.'); }
    if (sub === 'off') { db.whitelistMode = false; writeDB(db); await react('✅'); return reply('✅ Whitelist mode OFF.'); }

    const targets = mentioned.length ? mentioned : (quotedParticipant ? [quotedParticipant] : []);
    if (!targets.length) return reply(`Tag atau reply user.`);

    if (sub === 'add') {
        targets.forEach(t => { if (!db.whitelist.includes(t)) db.whitelist.push(t); });
        writeDB(db);
        await react('✅');
        return reply(`✅ ${targets.length} user ditambah ke whitelist.`);
    }

    if (sub === 'remove') {
        db.whitelist = db.whitelist.filter(j => !targets.includes(j));
        writeDB(db);
        await react('✅');
        return reply(`✅ ${targets.length} user dihapus dari whitelist.`);
    }
};
whitelist.command = ['whitelist', 'wl'];
whitelist.owner   = true;
whitelist.limit   = false;

export default blacklist;
