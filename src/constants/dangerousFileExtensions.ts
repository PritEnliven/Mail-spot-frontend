export const DANGEROUS_FILE_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.jar', '.app', '.deb', '.pkg', '.dmg',
    '.sh', '.bash', '.ps1', '.py', '.pl', '.rb', '.php', '.asp', '.aspx', '.jsp', '.cgi', '.msi', '.msp',
    '.dll', '.so', '.dylib', '.ocx', '.cpl', '.sys', '.drv', '.bin', '.iso', '.img', '.vhd', '.vmdk',
    '.rar', '.tar', '.gz', '.bz2', '.xz', '.lha', '.ace', '.arj', '.cab', '.lzh',
    '.scr', '.reg', '.inf', '.ins', '.isp', '.jse', '.wsf', '.wsh', '.ws', '.scf', '.lnk', '.url',
    '.docm', '.dotm', '.xlsm', '.xltm', '.xlam', '.pptm', '.potm', '.ppam', '.ppsm', '.sldm',
    '.ade', '.adp', '.mdb', '.accdb', '.accde', '.accdt', '.accdr', '.mda', '.mde', '.mdt', '.mdw'
];

export const isDangerousExtension = (extension: string): boolean => {
    const normalizedExtension = extension.toLowerCase().startsWith('.') 
        ? extension.toLowerCase() 
        : `.${extension.toLowerCase()}`;
    
    return DANGEROUS_FILE_EXTENSIONS.includes(normalizedExtension);
};
