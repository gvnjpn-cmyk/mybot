# 🤖 MyBot — WhatsApp Bot

Bot WhatsApp berbasis **@itsliaaa/baileys** (fork Baileys v7) dengan dukungan penuh **LID** dan **interactiveMessage**.

---

## 📁 Struktur

```
mybot/
├── index.js              ← entry point
├── handler.js            ← message router + LID resolver
├── package.json
├── sesi/                 ← otomatis dibuat saat login
├── settings/
│   ├── config.js         ← EDIT DI SINI
│   ├── colors.js
│   └── logger.js
├── lib/
│   ├── connection/
│   │   └── connect.js
│   └── scrape/
│       ├── deepai-api.js
│       └── fluxai-api.js
└── command/
    ├── menu.js
    ├── ping.js
    ├── info.js
    ├── ai.js
    └── flux.js
```

---

## ⚙️ Setup

```bash
# 1. Install
npm install

# 2. Edit config
nano settings/config.js   # isi owner, namaBot, prefix, dll

# 3. Jalankan
node index.js
```

Bot akan minta nomor HP → masukkan → dapat **pairing code** → tautkan di WA.

---

## 🔌 Buat Plugin Baru

```js
const handler = async (m, plug) => {
    const {
        reply, react, args,           // helper & input
        sock, chatId,                  // koneksi & tujuan
        senderJid, senderLid,          // identitas pengirim (LID support)
        isGroup, isAdmin, isBotAdmin,  // context grup
        isOwner, config                // akses & setting
    } = plug;

    await react('👀');
    await reply(`Halo! Kamu kirim: ${args}`);
};

handler.command  = ['test'];
handler.tags     = ['general'];
handler.limit    = true;
// handler.owner    = true;   // khusus owner
// handler.group   = true;    // khusus grup
// handler.private = true;    // khusus private
// handler.admin   = true;    // khusus admin grup
// handler.botAdmin = true;   // bot harus admin

export default handler;
```

Plugin **auto hot-reload** — edit plugin langsung aktif tanpa restart.

---

## 💡 interactiveMessage (button WA)

```js
await sock.sendMessage(chatId, {
    interactiveMessage: {
        header: "Judul",
        title: "Teks Utama",
        footer: "Footer",
        body: "Isi pesan",
        buttons: [
            // Tombol quick reply (kirim command otomatis)
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "Klik Saya",
                    id: "/ping"
                })
            },
            // Tombol buka URL
            {
                name: "cta_url",
                buttonParamsJson: JSON.stringify({
                    display_text: "Buka Link",
                    url: "https://example.com",
                    merchant_url: "https://example.com"
                })
            },
            // Tombol copy teks
            {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: "Copy",
                    id: "ref123",
                    copy_code: "KODE123"
                })
            }
        ]
    }
}, { quoted: m });
```

---

## 📦 Baileys yang dipakai

**`@itsliaaa/baileys`** — Fork Baileys v7 dengan:
- ✅ Full LID support (`senderLid`)
- ✅ `interactiveMessage` (buttons, quick_reply, cta_url, cta_copy)
- ✅ `albumMessage`, `eventMessage`
- ✅ Clean install, tanpa konflik `jimp`
- ✅ `findUserId()` untuk resolve LID ↔ JID
