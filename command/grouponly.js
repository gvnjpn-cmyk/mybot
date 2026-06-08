import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const DB_PATH    = path.resolve(process.cwd(), 'data/grouponly.json');

const readDB  = () => {
    if (!fs.existsSync(DB_PATH)) return { active: true };
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return { active: true }; }
};
const writeDB = (d) => {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(d, null, 2));
};

export const isGroupOnly = () => readDB().active;

const handler = async (m, plug) => {
    const { reply, react, args, config } = plug;

    const db  = readDB();
    const sub = args?.toLowerCase()?.trim();

    if (!sub || sub === 'status') {
        return reply(
`🔒 *Group Only Mode*

Status : ${db.active ? '🟢 ON' : '🔴 OFF'}

${config.prefix}grouponly on  — bot hanya respon di grup
${config.prefix}grouponly off — bot respon di mana saja`
        );
    }

    if (sub === 'on') {
        writeDB({ active: true });
        await react('✅');
        return reply('✅ Group only mode *ON*.\nBot hanya merespon command dari grup.');
    }

    if (sub === 'off') {
        writeDB({ active: false });
        await react('✅');
        return reply('✅ Group only mode *OFF*.\nBot merespon di grup dan DM.');
    }

    return reply(`Format: ${config.prefix}grouponly on/off/status`);
};

handler.command = ['grouponly'];
handler.owner   = true;
handler.limit   = false;

export default handler;
