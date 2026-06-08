import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const DB_PATH = path.resolve(process.cwd(), 'data/followclaim.json');

const readDB = () => {
    if (!fs.existsSync(DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
};

const writeDB = (data) => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// ===== .approve <nomor> — owner approve klaim =====
const handler = async (m, plug) => {
    const { reply, react, args, config, sock, chatId, userLimits } = plug;

    if (!args) {
        return reply(
`❌ Format salah!
Contoh: ${config.prefix}approve 628xxxxxxxxx

📋 *List pending:*
${getPendingList()}`
        );
    }

    const targetNum = args.trim().replace(/[^0-9]/g, '');
    const db        = readDB();

    if (!db[targetNum]) {
        return reply(`❌ Nomor *${targetNum}* tidak ada di daftar request.`);
    }

    if (db[targetNum].claimed) {
        return reply(`⚠️ Nomor *${targetNum}* sudah pernah di-approve sebelumnya.`);
    }

    // update DB
    db[targetNum].claimed   = true;
    db[targetNum].pending   = false;
    db[targetNum].approvedAt = Date.now();
    writeDB(db);

    // tambah limit ke userLimits (in-memory)
    const targetJid = `${targetNum}@s.whatsapp.net`;
    const limitKey  = targetJid;

    if (!userLimits[limitKey]) {
        userLimits[limitKey] = { count: 0, lastUsed: Date.now() };
    }
    // kurangi count agar efektif nambah 10 slot
    userLimits[limitKey].count = Math.max(0, (userLimits[limitKey].count || 0) - 10);

    // notif ke user
    try {
        await sock.sendMessage(targetJid, {
            text:
`✅ *Klaim kamu disetujui!*

Limit kamu bertambah *+10* 🎉
Selamat menikmati fitur bot ya!

> 🤖 ${config.namaBot}`
        });
    } catch {}

    await react('✅');
    await reply(`✅ Berhasil approve *${targetNum}*. Limit +10 sudah ditambahkan.`);
};

const getPendingList = () => {
    const DB_PATH2 = path.resolve(
        dirname(fileURLToPath(import.meta.url)),
        '../../data/followclaim.json'
    );
    if (!fs.existsSync(DB_PATH2)) return '_(kosong)_';
    try {
        const db = JSON.parse(fs.readFileSync(DB_PATH2, 'utf8'));
        const pending = Object.entries(db)
            .filter(([, v]) => v.pending && !v.claimed)
            .map(([k]) => `› ${k}`);
        return pending.length ? pending.join('\n') : '_(kosong)_';
    } catch { return '_(error baca db)_'; }
};

handler.command = ['approve'];
handler.tags    = ['owner'];
handler.owner   = true;   // hanya owner
handler.limit   = false;

export default handler;
