import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const DB_PATH    = path.resolve(process.cwd(), 'data/maintenance.json');

const readDB  = () => {
    if (!fs.existsSync(DB_PATH)) return { active: false, reason: '' };
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return { active: false, reason: '' }; }
};

const writeDB = (data) => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// export state checker buat handler.js
export const isMaintenanceMode = () => readDB().active;
export const getMaintenanceReason = () => readDB().reason;

const handler = async (m, plug) => {
    const { reply, react, args, config } = plug;

    const db = readDB();

    // /maintenance on [alasan]
    // /maintenance off
    // /maintenance status
    const sub    = args?.split(' ')[0]?.toLowerCase();
    const reason = args?.split(' ').slice(1).join(' ').trim() || 'Under maintenance.';

    if (!sub || sub === 'status') {
        return reply(
`🔧 *Maintenance Status*

Status : ${db.active ? '🔴 ON' : '🟢 OFF'}
${db.active ? `Reason : ${db.reason}` : ''}

Gunakan:
${config.prefix}maintenance on [alasan]
${config.prefix}maintenance off`
        );
    }

    if (sub === 'on') {
        writeDB({ active: true, reason });
        await react('🔴');
        return reply(`🔴 *Maintenance mode ON*\nReason: ${reason}\n\nBot tidak akan respon user biasa.`);
    }

    if (sub === 'off') {
        writeDB({ active: false, reason: '' });
        await react('🟢');
        return reply(`🟢 *Maintenance mode OFF*\nBot kembali normal.`);
    }

    return reply(`❌ Sub-command tidak dikenal. Gunakan: on / off / status`);
};

handler.command = ['maintenance', 'maint'];
handler.owner   = true;
handler.limit   = false;

export default handler;
