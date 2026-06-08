import colors from './colors.js';

export const logHeader = (title) => {
    console.log(`\n${colors.bright}${colors.cyan}==============================${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}   ${title}   ${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}==============================${colors.reset}`);
};

export const logFooter = () => {
    console.log(`${colors.bright}${colors.cyan}==============================${colors.reset}\n`);
};

export const logIncomingMessage = (sender, type, body, isGroup) => {
    const grp = isGroup ? `${colors.success}Ya${colors.reset}` : `${colors.error}Tidak${colors.reset}`;
    console.log(`${colors.info}[PESAN]${colors.reset} Dari: ${sender}`);
    console.log(`${colors.info}[PESAN]${colors.reset} Tipe: ${type} | Grup: ${grp}`);
    if (body) console.log(`${colors.gray}[BODY] "${body}"${colors.reset}`);
};

export const logNonCommand = (body) => {
    console.log(`${colors.dim}${colors.gray}[SKIP] Bukan perintah: "${body}"${colors.reset}`);
};

export const logCommandDetection = (command, args) => {
    console.log(`${colors.bright}${colors.magenta}[CMD] "${command}" | args: "${args}"${colors.reset}`);
};

export const logCommandStatus = (status, command) => {
    const map = {
        running:  `${colors.warning}[RUN] Menjalankan: "${command}"${colors.reset}`,
        success:  `${colors.success}[OK]  Berhasil: "${command}"${colors.reset}`,
        notfound: `${colors.error}[404] Tidak ditemukan: "${command}"${colors.reset}`,
    };
    console.log(map[status] || '');
};

export const logWarning = (msg) => console.log(`${colors.warning}[WARN] ${msg}${colors.reset}`);
export const logError = (msg, err) => console.error(`${colors.error}[ERR] ${msg}`, err, colors.reset);
export const logLimitInfo = (msg) => console.log(`${colors.info}[LIMIT] ${msg}${colors.reset}`);
export const logLimitBlocked = (msg) => console.log(`${colors.warning}[LIMIT-BLOCK] ${msg}${colors.reset}`);
