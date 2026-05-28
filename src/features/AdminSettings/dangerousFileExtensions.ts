export const DANGEROUS_FILE_EXTENSIONS = [
    // Executables and system files
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.app', '.deb', '.pkg', '.dmg', '.msi', '.msp',
    '.dll', '.so', '.dylib', '.ocx', '.cpl', '.sys', '.drv', '.bin', '.iso', '.img', '.vhd', '.vmdk',

    // Script files that can execute system commands
    '.vbs', '.jse', '.wsf', '.wsh', '.ws', '.ps1', '.bash', '.sh', '.reg', '.inf', '.ins', '.isp',
    '.scf', '.lnk', '.url',

    // Web server scripts that can execute on server
    '.php', '.asp', '.aspx', '.jsp', '.cgi',

    // Database files that can contain macros
    '.ade', '.adp', '.mdb', '.accdb', '.accde', '.accdt', '.accdr', '.mda', '.mde', '.mdt', '.mdw',

    // Office documents with macros (dangerous)
    '.docm', '.dotm', '.xlsm', '.xltm', '.xlam', '.pptm', '.potm', '.ppam', '.ppsm', '.sldm'
];

export const isDangerousExtension = (extension: string): boolean => {
    const normalizedExtension = extension.toLowerCase().startsWith('.')
        ? extension.toLowerCase()
        : `.${extension.toLowerCase()}`;

    return DANGEROUS_FILE_EXTENSIONS.includes(normalizedExtension);
};
