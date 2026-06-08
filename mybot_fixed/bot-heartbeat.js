/*
  Pasang di bot kamu — kirim heartbeat ke Vexor API tiap 30 detik
  Tambahkan di file utama bot (index.js / main.js)
*/

const VEXOR_API = process.env.VEXOR_URL || 'https://vexor-amber.vercel.app';
const VEXOR_KEY = process.env.VEXOR_KEY || 'VEXORXVIP-OWN';
let msgCount = 0;
let restartSha = null;

export function incrementMsg() { msgCount++; }

export async function startHeartbeat(sock) {
  // Kirim heartbeat tiap 30 detik
  setInterval(async () => {
    try {
      const mem = process.memoryUsage();
      await fetch(`${VEXOR_API}/api/dash/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': VEXOR_KEY },
        body: JSON.stringify({
          uptime:      Math.floor(process.uptime()),
          memory:      Math.round(mem.rss / 1024 / 1024), // MB
          version:     process.env.BOT_VERSION || '1.0.0',
          pluginCount: global._pluginCount || 0,
          msgCount,
        }),
      });
    } catch { /* silent */ }
  }, 30_000);

  // Cek restart signal tiap 30 detik
  setInterval(async () => {
    try {
      const r = await fetch(
        `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/.restart?ref=${process.env.GITHUB_BRANCH || 'main'}`,
        { headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, 'User-Agent': 'VexorBot' } }
      );
      if (!r.ok) return;
      const data = await r.json();
      if (restartSha && data.sha !== restartSha) {
        console.log('[Vexor] Restart signal diterima, restarting...');
        process.exit(0); // Pterodactyl auto-restart
      }
      restartSha = data.sha;
    } catch { /* silent */ }
  }, 30_000);

  console.log('[Vexor] Heartbeat & restart watcher aktif');
}
