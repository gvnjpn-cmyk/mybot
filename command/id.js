import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const DB_PATH    = path.resolve(__dirname, '../../data/followclaim.json');

const readDB = () => {
    if (!fs.existsSync(DB_PATH)) return {};
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { return {}; }
};

// ===== helper: get user tier =====
const getTier = (isOwner, isVip) => {
    if (isOwner) return { label: 'Owner', color: '#FFD700' };
    if (isVip)   return { label: 'VIP',   color: '#C084FC' };
    return             { label: 'Member', color: '#60A5FA' };
};

// ===== helper: fetch profile picture =====
const getProfilePic = async (sock, jid) => {
    try {
        const url = await sock.profilePictureUrl(jid, 'image');
        const res = await fetch(url);
        const buf = Buffer.from(await res.arrayBuffer());
        return await loadImage(buf);
    } catch {
        // default avatar kalau gagal
        const canvas = createCanvas(100, 100);
        const ctx    = canvas.getContext('2d');
        ctx.fillStyle = '#1E3A5F';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = '#60A5FA';
        ctx.font      = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', 50, 65);
        return await loadImage(canvas.toBuffer('image/png'));
    }
};

// ===== draw rounded rect =====
const roundRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
};

// ===== MAIN CANVAS =====
const generateIDCard = async (sock, { name, number, isOwner, isVip, limitLeft, maxLimit, config }) => {
    const W = 600, H = 320;
    const canvas = createCanvas(W, H);
    const ctx    = canvas.getContext('2d');

    // background gradient biru gelap
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   '#0F172A');
    bg.addColorStop(0.5, '#1E3A5F');
    bg.addColorStop(1,   '#0F172A');
    ctx.fillStyle = bg;
    roundRect(ctx, 0, 0, W, H, 20);
    ctx.fill();

    // border biru
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth   = 2;
    roundRect(ctx, 2, 2, W - 4, H - 4, 18);
    ctx.stroke();

    // glow effect di pojok
    const glow = ctx.createRadialGradient(W, 0, 0, W, 0, 200);
    glow.addColorStop(0,   'rgba(59,130,246,0.15)');
    glow.addColorStop(1,   'rgba(59,130,246,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // header bar
    ctx.fillStyle = 'rgba(59,130,246,0.2)';
    roundRect(ctx, 15, 15, W - 30, 40, 8);
    ctx.fill();

    // header text
    ctx.fillStyle = '#93C5FD';
    ctx.font      = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('◈ MEMBER CARD', 30, 40);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#60A5FA';
    ctx.fillText(config.namaBot.toUpperCase(), W - 30, 40);

    // profile picture circle
    const pp  = await getProfilePic(sock, number + '@s.whatsapp.net');
    const ppX = 30, ppY = 70, ppR = 55;

    ctx.save();
    ctx.beginPath();
    ctx.arc(ppX + ppR, ppY + ppR, ppR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(pp, ppX, ppY, ppR * 2, ppR * 2);
    ctx.restore();

    // circle border
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.arc(ppX + ppR, ppY + ppR, ppR, 0, Math.PI * 2);
    ctx.stroke();

    // tier badge
    const tier = getTier(isOwner, isVip);
    ctx.fillStyle = tier.color + '33';
    roundRect(ctx, ppX, ppY + ppR * 2 + 8, ppR * 2, 22, 6);
    ctx.fill();
    ctx.fillStyle   = tier.color;
    ctx.font        = 'bold 12px sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText(tier.label, ppX + ppR, ppY + ppR * 2 + 23);

    // name
    ctx.fillStyle = '#F0F9FF';
    ctx.font      = 'bold 22px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(name.length > 20 ? name.substring(0, 20) + '...' : name, 160, 100);

    // number
    ctx.fillStyle = '#94A3B8';
    ctx.font      = '13px sans-serif';
    ctx.fillText('+' + number, 160, 122);

    // divider
    ctx.strokeStyle = 'rgba(59,130,246,0.3)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(160, 135);
    ctx.lineTo(W - 30, 135);
    ctx.stroke();

    // limit bar
    const barX = 160, barY = 150, barW = W - 200, barH = 14;
    const pct   = Math.max(0, limitLeft / maxLimit);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    roundRect(ctx, barX, barY, barW, barH, 7);
    ctx.fill();

    const barColor = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    barColor.addColorStop(0, '#3B82F6');
    barColor.addColorStop(1, '#60A5FA');
    ctx.fillStyle = barColor;
    roundRect(ctx, barX, barY, Math.max(14, barW * pct), barH, 7);
    ctx.fill();

    ctx.fillStyle = '#93C5FD';
    ctx.font      = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Daily Limit', barX, barY - 6);
    ctx.textAlign = 'right';
    ctx.fillText(`${limitLeft} / ${maxLimit}`, barX + barW, barY - 6);

    // stats boxes
    const stats = [
        { label: 'TIER',   value: tier.label },
        { label: 'LIMIT',  value: `${limitLeft}/${maxLimit}` },
        { label: 'STATUS', value: 'Active' }
    ];

    stats.forEach((s, i) => {
        const bx = 160 + i * 140, by = 185, bw = 125, bh = 55;
        ctx.fillStyle = 'rgba(59,130,246,0.15)';
        roundRect(ctx, bx, by, bw, bh, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(59,130,246,0.4)';
        ctx.lineWidth   = 1;
        roundRect(ctx, bx, by, bw, bh, 8);
        ctx.stroke();

        ctx.fillStyle = '#64748B';
        ctx.font      = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.label, bx + bw / 2, by + 18);

        ctx.fillStyle = i === 0 ? tier.color : '#60A5FA';
        ctx.font      = 'bold 14px sans-serif';
        ctx.fillText(s.value, bx + bw / 2, by + 38);
    });

    // footer
    ctx.fillStyle = '#334155';
    ctx.font      = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`ID: ${number} · ${new Date().toLocaleDateString('id-ID')}`, W / 2, H - 15);

    return canvas.toBuffer('image/png');
};

// ===== HANDLER =====
const handler = async (m, plug) => {
    const { sock, chatId, reply, react, config, senderJid, senderLid, isOwner, m: msg, userLimits } = plug;

    const senderNum  = (senderLid || senderJid).replace(/@.+/, '');
    const senderName = m.pushName || senderNum;
    const limitKey   = senderLid || senderJid;

    // cek VIP dari followclaim db
    const db    = readDB();
    const isVip = db[senderNum]?.claimed || false;

    // hitung limit tersisa
    const maxLimit  = config.limit.maxDaily || 10;
    const usedLimit = userLimits?.[limitKey]?.count || 0;
    const limitLeft = Math.max(0, maxLimit - usedLimit);

    await react('⏳');

    try {
        console.log('[ID] Generating canvas...');
        const buffer = await generateIDCard(sock, {
            name:      senderName,
            number:    senderNum,
            isOwner,
            isVip,
            limitLeft,
            maxLimit,
            config
        });

        console.log('[ID] Buffer size:', buffer?.length || 0);
        if (!buffer || buffer.length < 100) {
            await react('❌');
            return reply('❌ Canvas buffer kosong. Canvas mungkin belum ter-install dengan benar.');
        }

        await sock.sendMessage(chatId, {
            image:   buffer,
            caption: `*${senderName}*\nTier: ${getTier(isOwner, isVip).label}\nLimit: ${limitLeft}/${maxLimit}`,
            footer:  config.namaBot
        }, { quoted: msg });

        // tombol terpisah
        await sock.sendMessage(chatId, {
            text:   `Want more limit? Follow our channel and claim +10!`,
            footer: config.namaBot,
            templateButtons: [
                {
                    text: 'Claim +10 Limit',
                    id:   `${config.prefix}followclaim`
                },
                {
                    text: 'Channel',
                    url:  config.social.channel,
                    useWebview: true
                }
            ]
        }, { quoted: msg });

        await react('✅');
    } catch (e) {
        await react('❌');
        await reply(`❌ Error generate ID: ${e.message}`);
    }
};

handler.command = ['id', 'idcard', 'profile'];
handler.tags    = ['general'];
handler.limit   = false;

export default handler;
