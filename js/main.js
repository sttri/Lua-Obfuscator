document.getElementById("run").onclick = function () {
    let code = document.getElementById("input").value;
    if (!code.trim()) return alert("请输入代码");

    // 1. 保护字符串内容
    const stringRegex = /(["'])(?:\\.|(?!\1).)*?\1/g;
    const strings = [];
    let protectedCode = code.replace(stringRegex, (match) => {
        strings.push(match);
        return `__STRING_${strings.length - 1}__`;
    });

    // 2. 保护 URL（特别处理 http/https）
    const urlRegex = /https?:\/\/[^\s"'<>{}[\]()]+/g;
    const urls = [];
    protectedCode = protectedCode.replace(urlRegex, (match) => {
        urls.push(match);
        return `__URL_${urls.length - 1}__`;
    });

    // 3. 保护函数调用中的点表示法
    const dotNotationRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*)/g;
    const dotNotations = [];
    protectedCode = protectedCode.replace(dotNotationRegex, (match) => {
        dotNotations.push(match);
        return `__DOT_${dotNotations.length - 1}__`;
    });

    // 4. 应用重命名混淆
    let renamedCode = renameLocals(protectedCode);
    
    // 5. 恢复被保护的内容（按相反顺序）
    for (let i = dotNotations.length - 1; i >= 0; i--) {
        renamedCode = renamedCode.replace(`__DOT_${i}__`, dotNotations[i]);
    }
    for (let i = strings.length - 1; i >= 0; i--) {
        renamedCode = renamedCode.replace(`__STRING_${i}__`, strings[i]);
    }
    for (let i = urls.length - 1; i >= 0; i--) {
        renamedCode = renamedCode.replace(`__URL_${i}__`, urls[i]);
    }

    // 6. 添加反调试和垃圾代码
    let antiDebug = `
local function checkDebug()
    local time1 = tick()
    for i = 1, 100 do
        local _ = math.random(1, 1000)
    end
    local time2 = tick()
    if time2 - time1 > 0.01 then
        return true
    end
    return false
end
if checkDebug() then
    return
end
`;

    // 7. 组合最终代码
    code = antiDebug + generateJunk() + renamedCode + generateJunk();

    // 8. 分块处理（最多5个分块）
    let chunkSize = Math.max(1000, Math.ceil(code.length / 5));
    let chunks = [];
    for (let i = 0; i < code.length; i += chunkSize) {
        chunks.push(code.substring(i, Math.min(i + chunkSize, code.length)));
    }

    // 确保不超过5个分块
    if (chunks.length > 5) {
        chunkSize = Math.ceil(code.length / 5);
        chunks = [];
        for (let i = 0; i < code.length; i += chunkSize) {
            chunks.push(code.substring(i, Math.min(i + chunkSize, code.length)));
        }
    }

    // 9. 加密每个分块
    let chunkKeys = [];
    let encryptedChunks = [];
    
    for (let i = 0; i < chunks.length; i++) {
        let chunkKey = randomKey();
        chunkKeys.push(chunkKey);
        let encrypted = xorEncrypt(chunks[i], chunkKey);
        encryptedChunks.push(b64e(encrypted));
    }

    let chunkKeysB64 = chunkKeys.map(k => b64e(k));
    let chunkDataB64 = encryptedChunks;

    // 10. 生成分块加载器（Luau语法）
    let chunkLoader = "local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\n" +
"local t={}\n" +
"for i=1,#b do t[b:sub(i,i)]=i-1 end\n" +
"\n" +
"local function d(s)\n" +
"    s=string.gsub(s,'[^'..b..'=]','')\n" +
"    local bits=''\n" +
"    for i=1,#s do\n" +
"        local c=s:sub(i,i)\n" +
"        if c=='=' then break end\n" +
"        local v=t[c] or 0\n" +
"        bits=bits..(bit32.band(bit32.rshift(v,5),1))\n" +
"        bits=bits..(bit32.band(bit32.rshift(v,4),1))\n" +
"        bits=bits..(bit32.band(bit32.rshift(v,3),1))\n" +
"        bits=bits..(bit32.band(bit32.rshift(v,2),1))\n" +
"        bits=bits..(bit32.band(bit32.rshift(v,1),1))\n" +
"        bits=bits..(bit32.band(v,1))\n" +
"    end\n" +
"    local bytes=''\n" +
"    for i=1,#bits,8 do\n" +
"        local b8=bits:sub(i,i+7)\n" +
"        if #b8==8 then\n" +
"            local n=0\n" +
"            n=n+(b8:sub(1,1)=='1' and 128 or 0)\n" +
"            n=n+(b8:sub(2,2)=='1' and 64 or 0)\n" +
"            n=n+(b8:sub(3,3)=='1' and 32 or 0)\n" +
"            n=n+(b8:sub(4,4)=='1' and 16 or 0)\n" +
"            n=n+(b8:sub(5,5)=='1' and 8 or 0)\n" +
"            n=n+(b8:sub(6,6)=='1' and 4 or 0)\n" +
"            n=n+(b8:sub(7,7)=='1' and 2 or 0)\n" +
"            n=n+(b8:sub(8,8)=='1' and 1 or 0)\n" +
"            bytes=bytes..string.char(n)\n" +
"        end\n" +
"    end\n" +
"    return bytes\n" +
"end\n" +
"\n" +
"local function x(d,k)\n" +
"    local o=''\n" +
"    for i=1,#d do\n" +
"        o=o..string.char(bit32.bxor(d:byte(i),k:byte((i-1)%#k+1)))\n" +
"    end\n" +
"    return o\n" +
"end\n" +
"\n" +
"local fullCode=''\n";

    // 11. 添加分块解密代码
    for (let i = 0; i < chunkKeysB64.length; i++) {
        chunkLoader += 
"fullCode=fullCode..x(d('" + chunkDataB64[i] + "'),d('" + chunkKeysB64[i] + "'))\n";
    }

    chunkLoader += "loadstring(fullCode)()";

    // 12. 最终加密层
    let key = randomKey(16);
    let encrypted = xorEncrypt(chunkLoader, key);
    let encryptedB64 = b64e(encrypted);
    let keyB64 = b64e(key);

    // 13. 生成最终输出（Luau兼容）
    let final = 
"local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\n" +
"local t={}\n" +
"for i=1,#b do t[b:sub(i,i)]=i-1 end\n" +
"\n" +
"local function d(s)\n" +
"    s=string.gsub(s,'[^'..b..'=]','')\n" +
"    local bits=''\n" +
"    for i=1,#s do\n" +
"        local c=s:sub(i,i)\n" +
"        if c=='=' then break end\n" +
"        local v=t[c] or 0\n" +
"        bits=bits..(bit32.band(bit32.rshift(v,5),1))\n" +
"        bits=bits..(bit32.band(bit32.rshift(v,4),1))\n" +
"        bits=bits..(bit32.band(bit32.rshift(v,3),1))\n" +
"        bits=bits..(bit32.band(bit32.rshift(v,2),1))\n" +
"        bits=bits..(bit32.band(bit32.rshift(v,1),1))\n" +
"        bits=bits..(bit32.band(v,1))\n" +
"    end\n" +
"    local bytes=''\n" +
"    for i=1,#bits,8 do\n" +
"        local b8=bits:sub(i,i+7)\n" +
"        if #b8==8 then\n" +
"            local n=0\n" +
"            n=n+(b8:sub(1,1)=='1' and 128 or 0)\n" +
"            n=n+(b8:sub(2,2)=='1' and 64 or 0)\n" +
"            n=n+(b8:sub(3,3)=='1' and 32 or 0)\n" +
"            n=n+(b8:sub(4,4)=='1' and 16 or 0)\n" +
"            n=n+(b8:sub(5,5)=='1' and 8 or 0)\n" +
"            n=n+(b8:sub(6,6)=='1' and 4 or 0)\n" +
"            n=n+(b8:sub(7,7)=='1' and 2 or 0)\n" +
"            n=n+(b8:sub(8,8)=='1' and 1 or 0)\n" +
"            bytes=bytes..string.char(n)\n" +
"        end\n" +
"    end\n" +
"    return bytes\n" +
"end\n" +
"\n" +
"local function x(d,k)\n" +
"    local o=''\n" +
"    for i=1,#d do\n" +
"        o=o..string.char(bit32.bxor(d:byte(i),k:byte((i-1)%#k+1)))\n" +
"    end\n" +
"    return o\n" +
"end\n" +
"\n" +
"local k=d('" + keyB64 + "')\n" +
"local data=d('" + encryptedB64 + "')\n" +
"loadstring(x(data,k))()";

    document.getElementById("output").value = final;
};