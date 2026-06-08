import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';
import { pathToFileURL } from 'url';
import axios             from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const CMD_DIR    = path.resolve(__dirname);

// ===== /addcmd namafile <code> =====
const handler = async (m, plug) => {
    const { sock, chatId, reply, react, args, config, m: msg } = plug;

    const mtype = Object.keys(msg.message)[0];
    const isDoc = mtype === 'documentMessage';
    const isQuotedDoc = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.documentMessage;

    // ===== MODE 1: kirim file .js =====
    if (isDoc || isQuotedDoc) {
        const docMsg   = isDoc ? msg.message.documentMessage : isQuotedDoc;
        const fileName = docMsg.fileName || 'plugin.js';

        if (!fileName.endsWith('.js')) return reply('❌ Only .js files are allowed.');

        await react('⏳');

        try {
            const stream  = await sock.downloadMediaMessage(isDoc ? msg : { message: { documentMessage: isQuotedDoc } });
            const outPath = path.join(CMD_DIR, fileName);
            fs.writeFileSync(outPath, stream);
            await react('✅');
            await reply(`✅ Plugin *${fileName}* saved and will be loaded on next hot-reload.`);
        } catch (e) {
            await react('❌');
            await reply(`❌ Failed to save file: ${e.message}`);
        }
        return;
    }

    // ===== MODE 2: ketik code =====
    if (!args) return reply(
`❌ Format salah!

*Kirim file .js:*
Kirim/quote file .js ke bot

*Ketik code:*
\`\`\`
${config.prefix}addcmd namafile
const handler = async (m, plug) => {
  const { reply } = plug;
  await reply('Hello!');
};
handler.command = ['hello'];
export default handler;
\`\`\``
    );

    const lines    = args.split('\n');
    const fileName = lines[0].trim().replace(/[^a-zA-Z0-9_-]/g, '') + '.js';
    const code     = lines.slice(1).join('\n').trim();

    if (!code) return reply(`❌ Code tidak boleh kosong.\nFormat: ${config.prefix}addcmd namafile\\n<code>`);
    if (!fileName.replace('.js', '')) return reply('❌ Nama file tidak valid.');

    const outPath = path.join(CMD_DIR, fileName);

    if (fs.existsSync(outPath)) {
        await reply(`⚠️ File *${fileName}* sudah ada. Mau overwrite? Kirim:\n${config.prefix}overwritecmd ${fileName}\\n<code baru>`);
        return;
    }

    try {
        fs.writeFileSync(outPath, code);
        await react('✅');
        await reply(`✅ Plugin *${fileName}* berhasil disimpan!\n\nAkan aktif otomatis dalam beberapa detik (hot-reload).`);
    } catch (e) {
        await react('❌');
        await reply(`❌ Gagal menyimpan: ${e.message}`);
    }
};

// ===== /overwritecmd namafile <code> =====
export const overwrite = async (m, plug) => {
    const { reply, react, args, config } = plug;

    if (!args) return reply(`❌ Format: ${config.prefix}overwritecmd namafile\\n<code>`);

    const lines    = args.split('\n');
    const fileName = lines[0].trim().replace(/[^a-zA-Z0-9_-]/g, '') + '.js';
    const code     = lines.slice(1).join('\n').trim();

    if (!code) return reply('❌ Code tidak boleh kosong.');

    const outPath = path.join(CMD_DIR, fileName);

    try {
        fs.writeFileSync(outPath, code);
        await react('✅');
        await reply(`✅ Plugin *${fileName}* berhasil di-overwrite!\n\nAkan aktif otomatis dalam beberapa detik.`);
    } catch (e) {
        await react('❌');
        await reply(`❌ Gagal: ${e.message}`);
    }
};

overwrite.command = ['overwritecmd'];
overwrite.owner   = true;
overwrite.limit   = false;

handler.command = ['addcmd'];
handler.owner   = true;
handler.limit   = false;

export default handler;
