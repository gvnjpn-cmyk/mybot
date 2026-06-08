/*
  Plugin AiCoder untuk bot Baileys
  Endpoint: POST /api/ai-coder (Vexor API)
*/

const VEXOR_API = 'https://vexor-amber.vercel.app/api/ai-coder';
const VEXOR_KEY = 'VEXORXVIP-OWN';

const handler = async (m, plug) => {
  const { sock, chatId, reply, react, config, m: msg } = plug;
  const text = m.body?.replace(/^[!/.](aicoder|aicode|gencode)\s*/i, '').trim();

  if (!text) {
    return reply(`*📝 AI CODER - Vexor API*

Contoh penggunaan:
• /aicoder buat landing page portfolio modern
• /aicoder buat website toko online sederhana
• /aicoder buat todo list dengan html css js

💡 Tips:
- Sebutkan framework (React, Vue, Tailwind)
- Jelaskan fitur yang dibutuhkan
- Bisa pakai bahasa Indonesia

⏱ Proses 30–60 detik`);
  }

  await react('⏳');
  await reply('🔄 Generating kode... mohon tunggu 30-60 detik');

  try {
    const res = await fetch(VEXOR_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VEXOR_KEY
      },
      body: JSON.stringify({ prompt: text })
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const raw = await res.text();
      await react('❌');
      return reply(`❌ API error: ${raw.slice(0, 200)}`);
    }

    const data = await res.json();

    if (!data.ok || !data.zipBase64) {
      await react('❌');
      return reply(`❌ Gagal: ${data.error || 'Unknown error'}`);
    }

    const zipBuffer = Buffer.from(data.zipBase64, 'base64');

    const caption = `✅ *Selesai!*
📁 ${data.totalFiles} file dibuat
🤖 Model: ${data.model}
📝 Prompt: ${data.prompt}${data.prompt?.length >= 100 ? '...' : ''}

*Files:*
${data.files.map(f => `• \`${f}\``).join('\n')}`;

    await sock.sendMessage(chatId, {
      document: zipBuffer,
      mimetype: 'application/zip',
      fileName: data.fileName,
      caption
    }, { quoted: msg });

    await react('✅');

  } catch (e) {
    await react('❌');
    await reply(`❌ Error: ${e.message}`);
  }
};

handler.help = ['aicoder <prompt>'];
handler.tags = ['tools'];
handler.command = ['aicoder', 'aicode', 'gencode'];
handler.limit = true;

export default handler;
