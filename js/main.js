document.getElementById("run").onclick = function () {
    let code = document.getElementById("input").value;
    if (!code.trim()) return alert("请输入代码");

    // 轻量反调试
    let antiDebug = `
local function checkDebug()
    local time1 = tick()
    for i = 1, 100 do
        local _ = i
    end
    local time2 = tick()
    if time2 - time1 > 0.1 then
        return true
    end
    return false
end
if checkDebug() then
    return
end
`;

    // 原始代码处理
    code = antiDebug + generateJunk() + renameLocals(code) + generateJunk();

    // 代码分块加密
    let chunkSize = Math.max(1000, Math.ceil(code.length / 5));
    let chunks = [];
    for (let i = 0; i < code.length; i += chunkSize) {
        chunks.push(code.substring(i, Math.min(i + chunkSize, code.length)));
    }

    // 最多5个分块
    if (chunks.length > 5) {
        chunkSize = Math.ceil(code.length / 5);
        chunks = [];
        for (let i = 0; i < code.length; i += chunkSize) {
            chunks.push(code.substring(i, Math.min(i + chunkSize, code.length)));
        }
    }

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

    // 动态生成密钥数据
    let dynamicKeyData = [];
    for (let i = 0; i < chunkKeysB64.length; i++) {
        dynamicKeyData.push({
            key: chunkKeysB64[i],
            data: chunkDataB64[i]
        });
    }

    // 将密钥数据编码为单个字符串
    let combinedData = b64e(JSON.stringify(dynamicKeyData));
    
    // 生成动态解密密钥
    let dynamicKey = randomKey(32);
    let encryptedDynamicData = xorEncrypt(combinedData, dynamicKey);
    let encryptedDynamicDataB64 = b64e(encryptedDynamicData);
    let dynamicKeyB64 = b64e(dynamicKey);

    // 分块加载器（不包含硬编码密钥）
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
"local function getChunkData()\n" +
"    local dynamicKey = d('DYNAMIC_KEY_PLACEHOLDER')\n" +
"    local encryptedData = d('ENCRYPTED_DATA_PLACEHOLDER')\n" +
"    local combined = x(encryptedData, dynamicKey)\n" +
"    \n" +
"    local jsonStr = ''\n" +
"    for i=1,#combined do\n" +
"        jsonStr = jsonStr .. string.char(combined:byte(i))\n" +
"    end\n" +
"    \n" +
"    local chunksData = {}\n" +
"    local pos = 1\n" +
"    while pos <= #jsonStr do\n" +
"        if jsonStr:sub(pos, pos) == '{' then\n" +
"            local endPos = jsonStr:find('}', pos)\n" +
"            if endPos then\n" +
"                local objStr = jsonStr:sub(pos, endPos)\n" +
"                local keyStart = objStr:find('\"key\":\"')\n" +
"                local dataStart = objStr:find('\"data\":\"')\n" +
"                if keyStart and dataStart then\n" +
"                    local keyEnd = objStr:find('\"', keyStart+7)\n" +
"                    local dataEnd = objStr:find('\"', dataStart+8)\n" +
"                    if keyEnd and dataEnd then\n" +
"                        local key = objStr:sub(keyStart+7, keyEnd-1)\n" +
"                        local data = objStr:sub(dataStart+8, dataEnd-1)\n" +
"                        table.insert(chunksData, {key=key, data=data})\n" +
"                    end\n" +
"                end\n" +
"                pos = endPos + 1\n" +
"            else\n" +
"                break\n" +
"            end\n" +
"        else\n" +
"            pos = pos + 1\n" +
"        end\n" +
"    end\n" +
"    \n" +
"    return chunksData\n" +
"end\n" +
"\n" +
"local chunksData = getChunkData()\n" +
"local fullCode = ''\n" +
"for i, chunk in ipairs(chunksData) do\n" +
"    fullCode = fullCode .. x(d(chunk.data), d(chunk.key))\n" +
"end\n" +
"loadstring(fullCode)()";

    // 替换占位符
    chunkLoader = chunkLoader
        .replace('DYNAMIC_KEY_PLACEHOLDER', dynamicKeyB64)
        .replace('ENCRYPTED_DATA_PLACEHOLDER', encryptedDynamicDataB64);

    // 单层加密
    let finalKey = randomKey(16);
    let encryptedLoader = xorEncrypt(chunkLoader, finalKey);
    let encryptedLoaderB64 = b64e(encryptedLoader);
    let finalKeyB64 = b64e(finalKey);

    // 最终输出
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
"local k=d('" + finalKeyB64 + "')\n" +
"local data=d('" + encryptedLoaderB64 + "')\n" +
"loadstring(x(data,k))()";

    document.getElementById("output").value = final;
};