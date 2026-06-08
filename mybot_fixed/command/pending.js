import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const DB_PATH = path.resolve(process.cwd(), 'data/followclaim.json');

// ===== .pending — owner lihat list request =====
const handler = async (m, plug) => {
    const { reply, config } = plug;

    if (!fs.existsSync(DB_PATH)) return reply('📭 Belum ada request klaim.');

    let db;
    try { db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
    catch { return reply('❌ Gagal baca database.'); }

    const pendingList = Object.entries(db).filter(([, v]) => v.pending && !v.claimed);
    const claimedList = Object.entries(db).filter(([, v]) => v.claimed);

    if (!pendingList.length && !claimedList.length) {
        return reply('📭 Belum ada request klaim.');
    }

    let text = `📋 *DAFTAR FOLLOW CLAIM*\n\n`;

    if (pendingList.length) {
        text += `⏳ *Pending (${pendingList.length}):*\n`;
        for (const [num, data] of pendingList) {
            const date = new Date(data.requestAt).toLocaleString('id-ID');
            text += `› ${num} — ${date}\n`;
            text += `  Approve: ${config.prefix}approve ${num}\n`;
        }
        text += '\n';
    }

    if (claimedList.length) {
        text += `✅ *Sudah Approve (${claimedList.length}):*\n`;
        for (const [num, data] of claimedList) {
            const date = new Date(data.approvedAt).toLocaleString('id-ID');
            text += `› ${num} — ${date}\n`;
        }
    }

    await reply(text.trim());
};

handler.command = ['pending', 'listclaim'];
handler.tags    = ['owner'];
handler.owner   = true;
handler.limit   = false;

export default handler;
