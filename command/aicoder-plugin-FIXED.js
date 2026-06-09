/*
  Plugin AiCoder untuk bot Baileys — FIXED VERSION
  Kirim ZIP kode, bukan panduan
*/

const VEXOR_API = 'https://vexor-amber.vercel.app/api/ai-coder';
const VEXOR_KEY = 'VEXORXVIP-OWN';

const handler = async (m, plug) => {
  const { sock, chatId, reply, react, m: msg } = plug;
  
  // Parse command — buang prefix
  let text = m.body || '';
  text = text.replace(/^[!/.](aicoder|aicode|gencode)\s*/i, '').trim();

  // Kalau kosong, kirim help
  if (!text || text.length === 0) {
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

  // Show loading
  await react('⏳');
  await reply('🔄 Generating kode... mohon tunggu 30-60 detik');

  try {
    console.log('[AiCoder] Sending prompt:', text.slice(0, 50) + '...');
    
    const res = await fetch(VEXOR_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': VEXOR_KEY
      },
      body: JSON.stringify({ prompt: text })
    });

    console.log('[AiCoder] Response status:', res.status);

    // Check content type
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const raw = await res.text();
      console.error('[AiCoder] Non-JSON response:', raw.slice(0, 100));
      await react('❌');
      return reply(`❌ API error: ${raw.slice(0, 200)}`);
    }

    const data = await res.json();
    console.log('[AiCoder] API response:', data.ok, data.zipBase64?.length);

    // Check response
    if (!data.ok || !data.zipBase64) {
      await react('❌');
      return reply(`❌ Gagal: ${data.error || 'No ZIP generated'}`);
    }

    // Convert base64 to buffer
    const zipBuffer = Buffer.from(data.zipBase64, 'base64');
    console.log('[AiCoder] ZIP buffer size:', zipBuffer.length);

    // Send ZIP
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
    console.log('[AiCoder] Success!');

  } catch (e) {
    console.error('[AiCoder] Error:', e.message);
    await react('❌');
    await reply(`❌ Error: ${e.message}`);
  }
};

handler.help = ['aicoder <prompt>'];
handler.tags = ['tools'];
handler.command = /^(aicoder|aicode|gencode)$/i;
handler.limit = true;

export default handler;
