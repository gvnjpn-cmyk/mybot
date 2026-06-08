import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const CACHE_PATH = path.resolve(process.cwd(), 'data/gclist.json');

const saveCache = (list) => {
    const dir = path.dirname(CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(list, null, 2));
};

const loadCache = () => {
    if (!fs.existsSync(CACHE_PATH)) return [];
    try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch { return []; }
};

// ===== /listgc =====
export const listgc = async (m, plug) => {
    const { sock, reply, react } = plug;

    await react('⏳');

    try {
        const groups = await sock.groupFetchAllParticipating();
        const list   = Object.values(groups).map((g, i) => ({
            index:   i + 1,
            jid:     g.id,
            name:    g.subject,
            members: g.participants?.length || 0
        }));

        saveCache(list);

        if (!list.length) return reply('❌ Bot tidak ada di grup manapun.');

        const text = list.map(g =>
            `${g.index}. *${g.name}*\n   👥 ${g.members} members\n   🆔 ${g.jid}`
        ).join('\n\n');

        await react('✅');
        await reply(`📋 *List Grup (${list.length})*\n\n${text}\n\nGunakan:\n/bc 1,2,3 pesan\n/bc all pesan`);
    } catch (e) {
        await react('❌');
        await reply(`❌ Gagal ambil list grup: ${e.message}`);
    }
};

listgc.command = ['listgc', 'gclist'];
listgc.owner   = true;
listgc.limit   = false;

// ===== /bc =====
const handler = async (m, plug) => {
    const { sock, reply, react, args, config } = plug;

    if (!args) return reply(
`❌ Format salah!

Kirim ke GC tertentu:
${config.prefix}bc 1,3,5 pesan kamu

Kirim ke semua GC:
${config.prefix}bc all pesan kamu

Lihat list GC dulu:
${config.prefix}listgc`
    );

    const parts   = args.split(' ');
    const target  = parts[0].toLowerCase();
    const message = parts.slice(1).join(' ').trim();

    if (!message) return reply(`❌ Pesan tidak boleh kosong!\n\nFormat: ${config.prefix}bc all pesan`);

    const cache = loadCache();
    if (!cache.length) return reply(`❌ List GC kosong. Jalankan dulu: ${config.prefix}listgc`);

    let targets = [];

    if (target === 'all') {
        targets = cache;
    } else {
        const indices = target.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        targets = cache.filter(g => indices.includes(g.index));
        if (!targets.length) return reply(`❌ Nomor GC tidak valid. Cek: ${config.prefix}listgc`);
    }

    await react('⏳');

    let success = 0, failed = 0;

    for (const gc of targets) {
        try {
            await sock.sendMessage(gc.jid, {
                text: `📢 *Broadcast*\n\n${message}\n\n— ${config.namaBot}`,
                footer: config.namaBot
            });
            success++;
            await new Promise(r => setTimeout(r, 1200));
        } catch {
            failed++;
        }
    }

    await react('✅');
    await reply(
`✅ *Broadcast Selesai!*

📨 Target  : ${targets.length} grup
✅ Terkirim: ${success}
❌ Gagal   : ${failed}`
    );
};

handler.command = ['bc', 'broadcast'];
handler.owner   = true;
handler.limit   = false;

export default handler;
