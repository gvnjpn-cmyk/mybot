import fetch from 'node-fetch';

// ===== KICK =====
export const kick = async (m, plug) => {
    const { sock, chatId, reply, react, config, m: msg } = plug;

    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
    const targets = mentioned.length ? mentioned : (quotedParticipant ? [quotedParticipant] : []);

    if (!targets.length) return reply(`Tag atau reply member yang mau di-kick.\nContoh: ${config.prefix}kick @user`);

    await react('⏳');
    try {
        await sock.groupParticipantsUpdate(chatId, targets, 'remove');
        await react('✅');
        await reply(`✅ ${targets.length} member berhasil di-kick.`);
    } catch (e) {
        await react('❌');
        await reply(`❌ Gagal kick: ${e.message}`);
    }
};
kick.command  = ['kick'];
kick.tags     = ['group'];
kick.group    = true;
kick.admin    = true;
kick.botAdmin = true;
kick.limit    = false;

// ===== ADD =====
export const add = async (m, plug) => {
    const { sock, chatId, reply, react, args, config } = plug;

    if (!args) return reply(`Format: ${config.prefix}add 628xxx`);

    const numbers = args.split(/[\s,]+/).map(n => n.replace(/[^0-9]/g, '') + '@s.whatsapp.net');

    await react('⏳');
    try {
        await sock.groupParticipantsUpdate(chatId, numbers, 'add');
        await react('✅');
        await reply(`✅ ${numbers.length} member berhasil di-add.`);
    } catch (e) {
        await react('❌');
        await reply(`❌ Gagal add: ${e.message}`);
    }
};
add.command  = ['add'];
add.tags     = ['group'];
add.group    = true;
add.admin    = true;
add.botAdmin = true;
add.limit    = false;

// ===== PROMOTE =====
export const promote = async (m, plug) => {
    const { sock, chatId, reply, react, config, m: msg } = plug;

    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
    const targets = mentioned.length ? mentioned : (quotedParticipant ? [quotedParticipant] : []);

    if (!targets.length) return reply(`Tag atau reply member.\nContoh: ${config.prefix}promote @user`);

    await react('⏳');
    try {
        await sock.groupParticipantsUpdate(chatId, targets, 'promote');
        await react('✅');
        await reply(`✅ ${targets.length} member dijadikan admin.`);
    } catch (e) {
        await react('❌');
        await reply(`❌ Gagal promote: ${e.message}`);
    }
};
promote.command  = ['promote'];
promote.tags     = ['group'];
promote.group    = true;
promote.admin    = true;
promote.botAdmin = true;
promote.limit    = false;

// ===== DEMOTE =====
export const demote = async (m, plug) => {
    const { sock, chatId, reply, react, config, m: msg } = plug;

    const mentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quotedParticipant = m.message?.extendedTextMessage?.contextInfo?.participant;
    const targets = mentioned.length ? mentioned : (quotedParticipant ? [quotedParticipant] : []);

    if (!targets.length) return reply(`Tag atau reply admin.\nContoh: ${config.prefix}demote @user`);

    await react('⏳');
    try {
        await sock.groupParticipantsUpdate(chatId, targets, 'demote');
        await react('✅');
        await reply(`✅ ${targets.length} admin dicopot.`);
    } catch (e) {
        await react('❌');
        await reply(`❌ Gagal demote: ${e.message}`);
    }
};
demote.command  = ['demote'];
demote.tags     = ['group'];
demote.group    = true;
demote.admin    = true;
demote.botAdmin = true;
demote.limit    = false;

// ===== HIDETAG =====
export const hidetag = async (m, plug) => {
    const { sock, chatId, reply, react, args, config, groupParticipants } = plug;

    if (!groupParticipants?.length) return reply('❌ Gagal ambil data grup.');

    const text = args || '📢 Notif penting!';
    const mentions = groupParticipants.map(p => p.id);

    await react('⏳');
    try {
        await sock.sendMessage(chatId, { text, mentions });
        await react('✅');
    } catch (e) {
        await react('❌');
        await reply(`❌ Gagal: ${e.message}`);
    }
};
hidetag.command  = ['hidetag', 'ht', 'tagall'];
hidetag.tags     = ['group'];
hidetag.group    = true;
hidetag.admin    = true;
hidetag.limit    = false;

export default kick;
