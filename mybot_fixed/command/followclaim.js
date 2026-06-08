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

// ===== .followclaim — user request klaim =====
const handler = async (m, plug) => {
    const { reply, config, senderJid, senderLid } = plug;

    const key = (senderLid || senderJid).replace(/@.+/, '');
    const db  = readDB();

    if (db[key]?.claimed) {
        return reply(`✅ Kamu sudah pernah klaim sebelumnya.`);
    }

    if (db[key]?.pending) {
        return reply(
`⏳ *Request kamu masih pending!*

Tunggu owner approve ya. Kalau belum dibalas dalam 24 jam, hubungi owner langsung.
👤 Owner: https://wa.me/${config.owner}`
        );
    }

    // simpan request
    db[key] = { pending: true, claimed: false, requestAt: Date.now() };
    writeDB(db);

    await reply(
`📢 *Follow Channel dulu ya!*

1. Follow channel ini:
   ${config.social.channel}

2. Screenshot bukti follow kamu
3. Kirim screenshot ke owner:
   https://wa.me/${config.owner}

Setelah owner verifikasi, limit kamu akan bertambah *+10* otomatis. 🎁`
    );
};

handler.command = ['followclaim', 'klaim'];
handler.tags    = ['general'];
handler.limit   = false;

export default handler;
