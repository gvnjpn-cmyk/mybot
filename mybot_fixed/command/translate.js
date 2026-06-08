import fetch from 'node-fetch';

const handler = async (m, plug) => {
    const { reply, react, args, config } = plug;

    if (!args) return reply(
`Format: ${config.prefix}tr <lang> <teks>

Contoh:
${config.prefix}tr en Halo dunia
${config.prefix}tr id Hello world
${config.prefix}tr ja Selamat pagi`
    );

    const parts  = args.trim().split(' ');
    const lang   = parts[0];
    const text   = parts.slice(1).join(' ');

    if (!text) return reply(`Format: ${config.prefix}tr <lang> <teks>`);

    await react('⏳');

    try {
        const res  = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`
        );
        const data = await res.json();
        const result = data[0]?.map(x => x?.[0]).filter(Boolean).join('') || 'No result';
        const srcLang = data[2] || 'auto';

        await react('✅');
        await reply(`🌐 *Translate*\n\n*From:* ${srcLang} → ${lang}\n\n${result}`);
    } catch (e) {
        await react('❌');
        await reply(`❌ Error: ${e.message}`);
    }
};

handler.command = ['tr', 'translate'];
handler.tags    = ['tools'];
handler.limit   = true;

export default handler;
