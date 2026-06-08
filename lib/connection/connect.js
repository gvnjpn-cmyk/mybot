import { DisconnectReason } from '@itsliaaa/baileys';
import { Boom }             from '@hapi/boom';
import qrcode               from 'qrcode-terminal';
import colors               from '../../settings/colors.js';
import { triggerIntro }     from '../../command/intro.js';

export const Connection = (sock, connectToWhatsApp, saveCreds, config, usePairingCode = false, phoneNumber = '') => {
    let pairingRequested = false;

    // ===== CONNECTION UPDATE =====
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !usePairingCode) {
            console.log(`\n${colors.warning}[QR] Scan QR berikut pakai WhatsApp kamu:${colors.reset}`);
            qrcode.generate(qr, { small: true });
            return;
        }

        if (usePairingCode && !pairingRequested && phoneNumber) {
            pairingRequested = true;
            try {
                await new Promise(r => setTimeout(r, 1500));
                const code      = await sock.requestPairingCode(phoneNumber);
                const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
                console.log(`\n${colors.bright}${colors.green}╔════════════════════════════╗${colors.reset}`);
                console.log(`${colors.bright}${colors.green}║  PAIRING CODE: ${formatted.padEnd(12)} ║${colors.reset}`);
                console.log(`${colors.bright}${colors.green}╚════════════════════════════╝${colors.reset}`);
                console.log(`${colors.info}Buka WhatsApp > Perangkat Tertaut > Tautkan dengan nomor telepon${colors.reset}`);
                console.log(`${colors.info}Masukkan kode di atas. Berlaku beberapa menit.${colors.reset}\n`);
            } catch (e) {
                console.log(`${colors.error}[PAIRING ERROR] ${e.message}${colors.reset}`);
                pairingRequested = false;
                setTimeout(async () => {
                    if (!pairingRequested) {
                        pairingRequested = true;
                        try {
                            const code      = await sock.requestPairingCode(phoneNumber);
                            const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
                            console.log(`\n${colors.bright}${colors.green}[PAIRING CODE] ${formatted}${colors.reset}`);
                        } catch (e2) {
                            console.log(`${colors.error}[PAIRING RETRY GAGAL] ${e2.message}${colors.reset}`);
                        }
                    }
                }, 5000);
            }
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`${colors.error}[KONEKSI] Putus. Kode: ${reason}${colors.reset}`);
            if (reason === DisconnectReason.loggedOut || reason === DisconnectReason.badSession) {
                console.log(`${colors.error}[WARN] Sesi buruk/logout! Hapus folder "sesi" lalu restart.${colors.reset}`);
                process.exit(1);
            } else {
                console.log(`${colors.info}[INFO] Reconnecting...${colors.reset}`);
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log(`\n${colors.success}[KONEKSI] Terhubung ke WhatsApp! ✓${colors.reset}`);
            console.log(`${colors.info}[BOT] Nama : ${sock.user?.name || 'Bot'}${colors.reset}`);
            console.log(`${colors.info}[BOT] JID  : ${sock.user?.id}${colors.reset}\n`);
        } else if (connection === 'connecting') {
            console.log(`${colors.info}[KONEKSI] Menghubungkan ke server WA...${colors.reset}`);
        }
    });

    // ===== GROUP PARTICIPANT UPDATE =====
    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        if (action !== 'add') return;
        try {
            const meta      = await sock.groupMetadata(id);
            const groupName = meta.subject || 'Group';
            await triggerIntro(sock, id, participants, groupName, config);
        } catch (e) {
            console.log(`${colors.error}[INTRO ERROR] ${e.message}${colors.reset}`);
        }
    });

    sock.ev.on('creds.update', saveCreds);
};
