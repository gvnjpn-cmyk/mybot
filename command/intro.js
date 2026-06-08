import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const DB_PATH    = path.resolve(process.cwd(), 'data/intro.json');

const readDB  = () => {
    if (!fs.existsSync(DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
};
const writeDB = (d) => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2));
};

// ===== /intro set|off|status =====
const handler = async (m, plug) => {
    const { reply, react, args, chatId, config } = plug;

    const db  = readDB();
    const sub = args?.split('\n')[0]?.trim()?.toLowerCase();

    if (!sub || sub === 'status') {
        const current = db[chatId];
        return reply(
`📢 *Intro Status*

Status  : ${current?.active ? '🟢 ON' : '🔴 OFF'}
${current?.active ? `\nPesan:\n${current.message}` : ''}

Gunakan:
${config.prefix}intro set
<pesan welcome kamu>

Variabel:
@user   — tag member baru
{name}  — nama member
{group} — nama grup

${config.prefix}intro off — matikan`
        );
    }

    if (sub === 'off') {
        if (db[chatId]) { db[chatId].active = false; writeDB(db); }
        await react('✅');
        return reply('✅ Intro *OFF*.');
    }

    if (sub === 'set') {
        const lines   = args.split('\n');
        const message = lines.slice(1).join('\n').trim();
        if (!message) return reply(`Format:\n${config.prefix}intro set\n<pesan welcome kamu>`);

        db[chatId] = { active: true, message };
        writeDB(db);
        await react('✅');
        return reply(`✅ Intro *ON*!\n\nPreview:\n${message}`);
    }
};

handler.command  = ['intro', 'setwelcome'];
handler.tags     = ['group'];
handler.group    = true;
handler.admin    = true;
handler.limit    = false;

export default handler;

// ===== auto welcome trigger (dipanggil dari handler.js) =====
export const triggerIntro = async (sock, chatId, participants, groupName, config) => {
    const db   = readDB();
    const data = db[chatId];
    if (!data?.active || !data?.message) return;

    for (const jid of participants) {
        try {
            const name    = jid.replace(/@.+/, '');
            const message = data.message
                .replace(/@user/g, `@${name}`)
                .replace(/\{name\}/g,  name)
                .replace(/\{group\}/g, groupName);

            await sock.sendMessage(chatId, {
                text:     message,
                mentions: [jid]
            });

            // kirim CN reminder setelah intro
            await new Promise(r => setTimeout(r, 1500));
            await sock.sendMessage(chatId, {
                text:
`👋 @${name}, selamat datang!

*CN WAJIB ANGGOTA*
Pilih salah satu format nama berikut:

1️⃣  Nama'𝖿𝗍 𝙎𝙀𝘼
2️⃣  ──Nama 𝙎𝙀𝘼࿐
3️⃣  𝙎𝙀𝘼── NAMA ᥫ᭡.

Ketik ${config.prefix}cn untuk lihat format & tombol salin.`,
                mentions: [jid]
            });
        } catch {}
    }
};
