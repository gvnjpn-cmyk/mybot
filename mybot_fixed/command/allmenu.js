const handler = async (m, plug) => {
    const { sock, config, chatId, m: msg } = plug;

    await sock.sendMessage(chatId, {
        image: { url: config.menuImage },
        caption:
`✦ *MENU CATEGORY*

✧ *GENERAL* — 5 fitur
┊ › ${config.prefix}menu
┊ › ${config.prefix}ping
┊ › ${config.prefix}info
┊ › ${config.prefix}id
┊ › ${config.prefix}cn

✧ *TOOLS* — 4 fitur
┊ › ${config.prefix}sticker
┊ › ${config.prefix}dl
┊ › ${config.prefix}qr
┊ › ${config.prefix}tr

✧ *AI* — 2 fitur
┊ › ${config.prefix}ai
┊ › ${config.prefix}flux

✧ *GROUP* — 7 fitur
┊ › ${config.prefix}kick
┊ › ${config.prefix}add
┊ › ${config.prefix}promote
┊ › ${config.prefix}demote
┊ › ${config.prefix}hidetag
┊ › ${config.prefix}antilink
┊ › ${config.prefix}swgc

✧ *OWNER* — 6 fitur
┊ › ${config.prefix}bc
┊ › ${config.prefix}listgc
┊ › ${config.prefix}maintenance
┊ › ${config.prefix}addcmd
┊ › ${config.prefix}blacklist
┊ › ${config.prefix}whitelist

✧ *BONUS* — 1 fitur
┊ › ${config.prefix}followclaim`,
        footer: config.namaBot,
        nativeFlow: [
            { text: 'General', id: `${config.prefix}tools`  },
            { text: 'Group',   id: `${config.prefix}groupmenu` }
        ]
    }, { quoted: msg });
};

handler.command = ['allmenu'];
handler.tags    = ['general'];
handler.limit   = false;

export default handler;
