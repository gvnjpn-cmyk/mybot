import colors from './settings/colors.js';
import { isMaintenanceMode, getMaintenanceReason } from './command/maintenance.js';
import { isBlacklisted, isWhitelisted, isWhitelistMode } from './command/security.js';
import { checkAntilink } from './command/antilink.js';
import { isGroupOnly } from './command/grouponly.js';
import {
    logHeader,
    logFooter,
    logIncomingMessage,
    logNonCommand,
    logCommandDetection,
    logCommandStatus,
    logWarning,
    logError,
    logLimitInfo,
    logLimitBlocked
} from './settings/logger.js';

export const setupMessageHandler = (sock, loadedPlugins, config, userLimits, checkAndApplyLimit) => {
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const now    = Date.now();
        const botJid = sock.user?.id?.replace(/:[0-9]+@/, '@') || '';

        for (const msg of messages) {
            try {
                if (!msg.message) continue;

                const mtype = Object.keys(msg.message)[0];

                // skip pesan protokol & sticker
                if ([
                    'protocolMessage',
                    'senderKeyDistributionMessage',
                    'reactionMessage',
                    'stickerMessage'
                ].includes(mtype)) continue;

                // skip pesan dari bot sendiri
                if (msg.key.fromMe) continue;

                // ===== RESOLUSI JID / LID =====
                const remoteJid = msg.key.remoteJid || '';
                const isGroup   = remoteJid.endsWith('@g.us');
                const chatId    = remoteJid;

                const rawSender = isGroup
                    ? (msg.key.participant || '')
                    : remoteJid;
                const senderJid = rawSender.replace(/:[0-9]+@/, '@');

                // ===== GROUP METADATA =====
                let groupMetadata = {};
                let groupName     = '';
                let participants  = [];
                let groupAdmins   = [];
                let groupOwner    = '';
                let isBotAdmin    = false;
                let isAdmin       = false;
                let isGroupOwner  = false;
                let senderLid     = null;

                if (isGroup) {
                    try {
                        groupMetadata = await sock.groupMetadata(chatId);
                        groupName     = groupMetadata.subject || '';

                        participants = (groupMetadata.participants || []).map(p => ({
                            id:    p.id   || null,
                            lid:   p.lid  || null,
                            admin: p.admin === 'superadmin' ? 'superadmin'
                                 : p.admin === 'admin'      ? 'admin'
                                 : null,
                            full:  p
                        }));

                        groupOwner  = participants.find(p => p.admin === 'superadmin')?.id || '';
                        groupAdmins = participants.filter(p => p.admin).map(p => p.id).filter(Boolean);
                        const groupAdminLids = participants.filter(p => p.admin).map(p => p.lid).filter(Boolean);
                        isBotAdmin  = groupAdmins.includes(botJid) || groupAdminLids.includes(botJid);
                        isAdmin     = groupAdmins.includes(senderJid) || groupAdminLids.includes(senderJid) ||
                                      (senderLid ? groupAdmins.includes(senderLid) || groupAdminLids.includes(senderLid) : false);
                        isGroupOwner = groupOwner === senderJid;

                        // resolve LID sender
                        const pData = participants.find(p =>
                            p.id === senderJid || p.lid === senderJid
                        );
                        senderLid = pData?.lid || null;
                    } catch {}
                }

                // ===== AMBIL BODY PESAN =====
                let body = '';
                const m  = msg.message;

                if (m.conversation)
                    body = m.conversation;
                else if (m.extendedTextMessage?.text)
                    body = m.extendedTextMessage.text;
                else if (m.imageMessage?.caption)
                    body = m.imageMessage.caption;
                else if (m.videoMessage?.caption)
                    body = m.videoMessage.caption;
                else if (m.documentMessage?.caption)
                    body = m.documentMessage.caption;
                else if (m.buttonsResponseMessage?.selectedButtonId)
                    body = m.buttonsResponseMessage.selectedButtonId;
                else if (m.listResponseMessage?.singleSelectReply?.selectedRowId)
                    body = m.listResponseMessage.singleSelectReply.selectedRowId;
                else if (m.templateButtonReplyMessage?.selectedId)
                    body = m.templateButtonReplyMessage.selectedId;
                else if (m.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
                    try {
                        const p = JSON.parse(m.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
                        body = p.id || p.body || '';
                    } catch {}
                }

                // ===== LOG =====
                const displaySender = senderLid
                    ? `${colors.cyan}LID:${colors.reset}${senderLid} | ${colors.cyan}JID:${colors.reset}${senderJid}`
                    : `${colors.cyan}JID:${colors.reset}${senderJid}`;

                logHeader('MYBOT');
                logIncomingMessage(displaySender, mtype, body, isGroup);

                // ===== CEK OWNER (dipindah ke atas biar antilink bisa akses) =====
                const ownerNum = config.owner.replace(/[^0-9]/g, '');
                const ownerLid = (config.ownerLid || '').replace(/[^0-9]/g, '');
                const isOwner  = senderJid.replace(/@.+/, '') === ownerNum ||
                                 (senderLid ? senderLid.replace(/@.+/, '') === ownerNum : false) ||
                                 (ownerLid  ? senderJid.replace(/@.+/, '') === ownerLid : false) ||
                                 (ownerLid && senderLid ? senderLid.replace(/@.+/, '') === ownerLid : false);

                // ===== PARSE COMMAND =====
                const prefix = config.prefix;
                if (!body.trim().startsWith(prefix)) {
                    logNonCommand(body);
                    // antilink check on non-command messages
                    if (isGroup) {
                        const antilinkPlug = { sock, chatId, senderJid, senderLid, isAdmin, isOwner, isBotAdmin };
                        await checkAntilink(msg, antilinkPlug).catch(() => {});
                    }
                    logFooter();
                    continue;
                }

                const bodyTrimmed = body.trim().slice(prefix.length).trim();
                const [command, ...argArr] = bodyTrimmed.split(' ');
                const args = argArr.join(' ');
                const cmd  = command.toLowerCase();

                logCommandDetection(cmd, args);

                // ===== QUOTED =====
                const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage || null;

                // ===== PLUG OBJECT =====
                const plug = {
                    sock,
                    command: cmd,
                    args,
                    text: body,
                    prefix,
                    m: msg,
                    config,
                    isGroup,
                    chatId,
                    senderJid,
                    senderLid,
                    botJid,
                    isOwner,
                    groupMetadata,
                    groupName,
                    participants,
                    groupParticipants: participants || [],
                    groupOwner,
                    groupAdmins,
                    isBotAdmin,
                    isAdmin,
                    isGroupOwner,
                    quoted,

                    reply: async (text) =>
                        sock.sendMessage(chatId, { text: String(text) }, { quoted: msg }),

                    react: async (emoji) =>
                        sock.sendMessage(chatId, { react: { text: emoji, key: msg.key } }),

                    // mention by LID (kalau ada) atau JID biasa
                    mention: async (text, jids = []) => {
                        // jids bisa array of JID atau LID
                        return sock.sendMessage(chatId, {
                            text,
                            mentions: jids
                        }, { quoted: msg });
                    }
                };

                // ===== JALANKAN PLUGIN =====
                let handled = false;

                for (const plugin of loadedPlugins) {
                    if (typeof plugin !== 'function' || !plugin.command) continue;

                    const commands = Array.isArray(plugin.command)
                        ? plugin.command
                        : [plugin.command];

                    if (!commands.map(c => String(c).toLowerCase()).includes(cmd)) continue;

                    logCommandStatus('running', cmd);

                    // group only check
                    if (!isOwner && !isGroup && isGroupOnly()) {
                        await plug.reply(`This bot can only be used in groups.\nContact the owner for more info.`);
                        handled = true; break;
                    }

                    // blacklist check
                    if (!isOwner && (isBlacklisted(senderJid) || isBlacklisted(senderLid))) {
                        handled = true; break;
                    }

                    // whitelist mode check
                    if (!isOwner && isWhitelistMode() && !isWhitelisted(senderJid) && !isWhitelisted(senderLid)) {
                        handled = true; break;
                    }

                    // maintenance mode check
                    if (isMaintenanceMode() && !isOwner && plugin.command[0] !== 'maintenance') {
                        await plug.reply(`🔧 Bot is currently under maintenance.\n${getMaintenanceReason()}\n\nPlease wait.`);
                        handled = true; break;
                    }

                    // permission checks
                    if (plugin.owner && !isOwner) {
                        await plug.reply(config.mess.owner);
                        logWarning(`Owner only: "${cmd}"`);
                        handled = true; break;
                    }
                    if (plugin.group && !isGroup) {
                        await plug.reply(config.mess.ingroup);
                        logWarning(`Group only: "${cmd}"`);
                        handled = true; break;
                    }
                    if (plugin.private && isGroup) {
                        await plug.reply(config.mess.privateChat);
                        logWarning(`Private only: "${cmd}"`);
                        handled = true; break;
                    }
                    if (plugin.admin && !isAdmin && !isOwner) {
                        await plug.reply(config.mess.admin);
                        logWarning(`Admin only: "${cmd}"`);
                        handled = true; break;
                    }
                    if (plugin.botAdmin && !isBotAdmin) {
                        await plug.reply(config.mess.botAdmin);
                        logWarning(`Bot harus admin: "${cmd}"`);
                        handled = true; break;
                    }

                    // limit check
                    if (config.limit.enable && plugin.limit && !isOwner) {
                        const limitKey = senderLid || senderJid;
                        if (!checkAndApplyLimit(limitKey)) {
                            const data     = userLimits[limitKey];
                            const timeDiff = data.lastUsed + config.limit.resetIntervalMs - now;
                            const remH     = Math.ceil(timeDiff / (60 * 60 * 1000));
                            const remM     = Math.ceil(timeDiff / (60 * 1000));
                            const remStr   = remH > 0 ? `${remH} jam` : `${remM} menit`;

                            const limitMsg = config.limit.message
                                .replace('%maxDaily%', config.limit.maxDaily)
                                .replace('%resetHours%', config.limit.resetIntervalMs / (60 * 60 * 1000))
                                .replace('%remainingTime%', remStr)
                                .replace('%prefix%', config.prefix);

                            await plug.reply(limitMsg);
                            logLimitBlocked(`${senderJid} limit untuk "${cmd}"`);
                            handled = true; break;
                        } else {
                            const used = userLimits[senderLid || senderJid]?.count || 0;
                            logLimitInfo(`${senderJid} pakai "${cmd}". Sisa: ${config.limit.maxDaily - used}`);
                        }
                    }

                    // eksekusi plugin
                    try {
                        await plugin(msg, plug);
                        logCommandStatus('success', cmd);
                    } catch (err) {
                        logError(`Error di plugin "${cmd}":`, err);
                        await plug.reply(config.mess.error);
                    }
                    handled = true;
                    break;
                }

                if (!handled) logCommandStatus('notfound', cmd);
                logFooter();

            } catch (err) {
                logError('Handler error:', err);
            }
        }
    });
};
