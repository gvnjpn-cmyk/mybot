import {
    makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
    fetchLatestBaileysVersion
} from '@itsliaaa/baileys';

import { Boom }          from '@hapi/boom';
import P                 from 'pino';
import fs                from 'fs';
import path              from 'path';
import readline          from 'readline';
import { fileURLToPath } from 'url';
import { dirname }       from 'path';
import { pathToFileURL } from 'url';

import config            from './settings/config.js';
import colors            from './settings/colors.js';
import { setupMessageHandler } from './handler.js';
import { Connection }    from './lib/connection/connect.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ===== BANNER =====
console.log(`\n${colors.bright}${colors.cyan}
  ╔══════════════════════════════╗
  ║        M Y B O T             ║
  ║  @itsliaaa/baileys | LID ✓  ║
  ╚══════════════════════════════╝
${colors.reset}`);

// ===== PLUGIN LOADER =====
const PLUGINS_DIR = path.resolve(__dirname, './command');

const scanPlugins = (dir) => {
    let files = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
            const full = path.join(dir, e.name);
            if (e.isDirectory()) files.push(...scanPlugins(full));
            else if (e.name.endsWith('.js')) files.push(full);
        }
    } catch {}
    return files;
};

const loadPlugins = async () => {
    const files   = scanPlugins(PLUGINS_DIR);
    const plugins = [];

    for (const filePath of files) {
        try {
            const url = pathToFileURL(filePath).href + `?t=${Date.now()}`;
            const mod = await import(url);
            // load default export
            const plugin = mod?.default || mod;
            if (plugin?.command) {
                plugin.filename = path.basename(filePath);
                plugins.push(plugin);
            }
            // load named exports (misal overwrite, dll)
            for (const key of Object.keys(mod)) {
                if (key === 'default') continue;
                const named = mod[key];
                if (typeof named === 'function' && named.command) {
                    named.filename = path.basename(filePath);
                    plugins.push(named);
                }
            }
            if (!plugin?.command && !Object.keys(mod).some(k => k !== 'default' && mod[k]?.command)) {
                console.log(`${colors.warning}[PLUGIN] Tidak ada .command di ${path.basename(filePath)}${colors.reset}`);
            }
        } catch (e) {
            console.log(`${colors.error}[PLUGIN ERROR] ${path.basename(filePath)}:`, e.message, colors.reset);
        }
    }

    console.log(`${colors.info}[PLUGIN] ${plugins.length} plugin dimuat${colors.reset}`);
    return plugins;
};

// ===== LIMIT SYSTEM =====
const userLimits = {};

const checkAndApplyLimit = (userKey) => {
    if (!config.limit.enable) return true;

    const now  = Date.now();
    let   data = userLimits[userKey];

    if (!data) {
        data = { count: 0, lastUsed: now };
        userLimits[userKey] = data;
    }

    if (now - data.lastUsed > config.limit.resetIntervalMs) {
        data.count    = 0;
        data.lastUsed = now;
    }

    if (data.count >= config.limit.maxDaily) return false;

    data.count++;
    data.lastUsed = now;
    return true;
};

// ===== PHONE NUMBER INPUT =====
const question = (text) => new Promise(res => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(text, ans => { rl.close(); res(ans.trim()); });
});

// ===== MAIN CONNECT =====
let currentSock = null;

async function connectToWhatsApp() {
    if (currentSock) {
        try { await currentSock.end(); } catch {}
        currentSock = null;
    }

    const sessionDir = path.resolve(__dirname, 'sesi');
    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    let version;
    try {
        const fetched = await fetchLatestBaileysVersion();
        version = fetched.version;
    } catch {
        version = [2, 3000, 1023456789];
    }

    const usePairingCode = !state.creds?.registered;

    // Kalau pakai pairing code, tanya nomor dulu sebelum buat socket
    let phoneNumber = '';
    if (usePairingCode) {
        phoneNumber = config.pairingNumber || '';
        if (!phoneNumber) {
            phoneNumber = await question(`${colors.cyan}[PAIRING] Masukkan nomor HP (contoh: 628xxx): ${colors.reset}`);
        }
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        console.log(`${colors.info}[PAIRING] Nomor: ${phoneNumber}${colors.reset}`);
        console.log(`${colors.info}[PAIRING] Menghubungkan ke server WA...${colors.reset}\n`);
    }

    const sock = makeWASocket({
        version,
        logger:              P({ level: 'silent' }),
        printQRInTerminal:   false,   // kita handle manual di connect.js
        auth:                state,
        browser:             Browsers.ubuntu('Chrome'),
        msgRetryCounterMap:  {},
        retryRequestDelayMs: 250,
        markOnlineOnConnect: false,
        emitOwnEvents:       true,
        syncFullHistory:     false,
        patchMessageBeforeSending: (msg) => {
            if (msg?.contextInfo) delete msg.contextInfo.mentionedJid;
            return msg;
        }
    });

    currentSock = sock;

    const plugins = await loadPlugins();
    setupMessageHandler(sock, plugins, config, userLimits, checkAndApplyLimit);
    Connection(sock, connectToWhatsApp, saveCreds, config, usePairingCode, phoneNumber);

    startPluginWatcher(plugins);
}

// ===== PLUGIN HOT RELOAD =====
let watching = false;

const startPluginWatcher = (plugins) => {
    if (watching) return;
    watching = true;

    fs.watch(PLUGINS_DIR, { recursive: true }, async (event, filename) => {
        if (!filename?.endsWith('.js')) return;
        console.log(`${colors.warning}[RELOAD] Perubahan di: ${filename}${colors.reset}`);
        const newPlugins = await loadPlugins();
        plugins.length = 0;
        newPlugins.forEach(p => plugins.push(p));
        console.log(`${colors.success}[RELOAD] ${plugins.length} plugin aktif${colors.reset}`);
    });
};

connectToWhatsApp();
