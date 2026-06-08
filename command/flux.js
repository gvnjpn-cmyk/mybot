import { fluxAI } from '../lib/scrape/fluxai-api.js';

const handler = async (m, plug) => {
    const { sock, chatId, reply, react, args, config } = plug;

    if (!args) return reply(`❌ Kurang prompt!\nContoh: ${config.prefix}flux cat on the moon`);

    await react('🎨');
    await reply('⏳ Generate gambar, tunggu bentar...');

    try {
        const imageUrl = await fluxAI(args);
        await sock.sendMessage(chatId, {
            image: { url: imageUrl },
            caption: `🎨 *Flux AI*\n📝 Prompt: ${args}`
        }, { quoted: m });
        await react('✅');
    } catch (e) {
        await reply(`❌ Gagal: ${e.message}`);
        await react('❌');
    }
};

handler.command = ['flux', 'imagine'];
handler.tags    = ['ai'];
handler.limit   = true;

export default handler;
