import { DeepAI } from '../lib/scrape/deepai-api.js';

const handler = async (m, plug) => {
    const { reply, react, args, config } = plug;

    if (!args) return reply(`❌ Kurang prompt!\nContoh: ${config.prefix}ai siapa kamu?`);

    await react('🤔');

    try {
        const result = await DeepAI(args);
        const output = typeof result === 'string'
            ? result
            : result?.output || result?.text || JSON.stringify(result);
        await reply(`🤖 *DeepAI*\n\n${output}`);
        await react('✅');
    } catch (e) {
        await reply(`❌ Gagal: ${e.message}`);
        await react('❌');
    }
};

handler.command = ['ai', 'deepai', 'chat'];
handler.tags    = ['ai'];
handler.limit   = true;

export default handler;
