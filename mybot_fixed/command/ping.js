const handler = async (m, plug) => {
    const { reply, react } = plug;
    const start = Date.now();
    await react('⏱️');
    const latency = Date.now() - start;
    await reply(`🏓 *Pong!*\n⚡ Latency: *${latency}ms*`);
    await react('✅');
};

handler.command = ['ping', 'speed'];
handler.tags    = ['general'];
handler.limit   = false;

export default handler;
