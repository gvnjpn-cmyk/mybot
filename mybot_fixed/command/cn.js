const CN_FORMATS = [
    { label: "Format 1", template: "Nama'𝖿𝗍 𝙎𝙀𝘼",    example: "Rizky'𝖿𝗍 𝙎𝙀𝘼"    },
    { label: "Format 2", template: "──Nama 𝙎𝙀𝘼࿐",      example: "──Rizky 𝙎𝙀𝘼࿐"      },
    { label: "Format 3", template: "𝙎𝙀𝘼── NAMA ᥫ᭡.",   example: "𝙎𝙀𝘼── RIZKY ᥫ᭡."   }
];

const handler = async (m, plug) => {
    const { sock, chatId, config, m: msg, senderJid, senderLid } = plug;

    const senderName = m.pushName || (senderLid || senderJid).replace(/@.+/, '');

    // kirim tiap format dengan button salin
    for (const fmt of CN_FORMATS) {
        const filled = fmt.template.replace(/Nama/gi, senderName).replace(/NAMA/g, senderName.toUpperCase());

        await sock.sendMessage(chatId, {
            text:
`*${fmt.label}*
> ${filled}`,
            footer: config.namaBot,
            templateButtons: [
                {
                    text: '📋 Salin Format',
                    copy: filled
                }
            ]
        }, { quoted: msg });

        await new Promise(r => setTimeout(r, 500));
    }
};

handler.command = ['cn', 'changename', 'format'];
handler.tags    = ['general'];
handler.limit   = false;

export default handler;
