import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { watchFile, unwatchFile } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const config = {
    // ===== BOT INFO =====
    namaBot:    "MyBot",
    namaOwner:  "Fiz",
    owner:      "6281234567890",   // nomor owner tanpa +
    ownerLid:   "",                // LID owner (isi angka dari console, misal: 50521901658250)
    prefix:     "/",
    menuImage:  "https://i.ibb.co/placeholder.png",  // ganti URL gambar header menu

    // ===== LIMIT =====
    limit: {
        enable:           true,
        maxDaily:         10,
        resetIntervalMs:  24 * 60 * 60 * 1000,
        message:
`You've reached your daily limit of %maxDaily% uses.
Resets in %remainingTime%.

Want more? Follow our channel and claim +10 free limit:
> Type %prefix%followclaim to request`
    },

    // ===== ERROR MESSAGES =====
    mess: {
        ingroup:     "This command can only be used inside a group.",
        privateChat: "This command can only be used in private chat.",
        admin:       "This command is for group admins only.",
        owner:       "This command is for the bot owner only.",
        botAdmin:    "Bot needs to be an admin first.",
        wait:        "Please wait, processing your request...",
        error:       "Something went wrong. Please try again later."
    },

    // ===== SOCIAL =====
    social: {
        channel:  "https://whatsapp.com/channel/xxxxx",
        github:   "https://github.com/",
        telegram: "https://t.me/"
    }
};

let file = __filename;
watchFile(file, () => {
    unwatchFile(file);
    console.log('\x1b[32m' + file + ' updated!\x1b[0m');
});

export default config;
