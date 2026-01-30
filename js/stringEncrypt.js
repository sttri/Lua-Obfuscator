function xorEncrypt(str, key) {
    let out = "";
    for (let i = 0; i < str.length; i++) {
        out += String.fromCharCode(str.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return btoa(out);
}

function encryptLuaStrings(code, key) {
    return code.replace(/(["'])(.*?)\1/g, (match, quote, content) => {
        // 跳过空字符串
        if (!content.trim()) return match;

        const enc = xorEncrypt(content, key);
        return `_S("${enc}")`;
    });
}