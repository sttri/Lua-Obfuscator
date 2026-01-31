document.getElementById("run").onclick = function () {
    let code = document.getElementById("input").value;
    if (!code.trim()) return alert("请输入代码");

    // 添加反调试检测
    let antiDebug = `
local debug = debug
local getinfo = debug.getinfo
local function checkDebug()
    if type(debug) ~= 'table' then
        return true
    end
    
    local info = getinfo(1, "S")
    if info.source:find("@") ~= 1 then
        return true
    end
    
    local time1 = tick()
    local x = 0
    for i = 1, 1000000 do
        x = x + i
    end
    local time2 = tick()
    if time2 - time1 > 0.5 then
        return true
    end
    
    if getinfo(0) ~= nil then
        return true
    end
    
    local suc, err = pcall(function()
        debug.getupvalue(function() end, 1)
    end)
    if not suc then
        return true
    end
    
    return false
end

if checkDebug() then
    while true do end
end
`;

    // 原始代码加垃圾代码和反调试
    code = antiDebug + generateJunk() + renameLocals(code) + generateJunk();

    // 代码分块加密
    let chunkSize = 500;
    let chunks = [];
    for (let i = 0; i < code.length; i += chunkSize) {
        chunks.push(code.substring(i, i + chunkSize));
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

    // 构建分块加载器
    let chunkLoader = `
local function d1(s)
    local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    s=string.gsub(s,'[^'..b..'=]','')
    local r=''
    for i=1,#s do
        local c=string.sub(s,i,i)
        if c=='=' then break end
        local v=string.find(b,c,1,true)-1
        for j=5,0,-1 do
            r=r..((bit32.rshift(v,j))%2)
        end
    end
    local o=''
    for i=1,#r,8 do
        local b8=string.sub(r,i,i+7)
        if #b8==8 then
            local n=0
            for k=1,8 do
                n=n*2+(string.sub(b8,k,k)=='1' and 1 or 0)
            end
            o=o..string.char(n)
        end
    end
    return o
end

local function x1(d,k)
    local o=''
    for i=1,#d do
        o=o..string.char(bit32.bxor(string.byte(d,i),string.byte(k,(i-1)%#k+1)))
    end
    return o
end

local keys = {}
local datas = {}
`;

    // 添加分块数据
    for (let i = 0; i < chunkKeysB64.length; i++) {
        chunkLoader += `
keys[${i + 1}] = d1('${chunkKeysB64[i]}')
datas[${i + 1}] = d1('${chunkDataB64[i]}')`;
    }

    chunkLoader += `

local fullCode = ''
for i = 1, #keys do
    fullCode = fullCode .. x1(datas[i], keys[i])
end

loadstring(fullCode)()
`;

    // 第一层加密
    let key1 = randomKey();
    let enc1 = xorEncrypt(chunkLoader, key1);
    let enc1B64 = b64e(enc1);
    let key1B64 = b64e(key1);
    
    // 第二层包裹
    let layer2 = 
"local function d1(s)\n" +
"    local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\n" +
"    s=string.gsub(s,'[^'..b..'=]','')\n" +
"    local r=''\n" +
"    for i=1,#s do\n" +
"        local c=string.sub(s,i,i)\n" +
"        if c=='=' then break end\n" +
"        local v=string.find(b,c,1,true)-1\n" +
"        for j=5,0,-1 do\n" +
"            r=r..((bit32.rshift(v,j))%2)\n" +
"        end\n" +
"    end\n" +
"    local o=''\n" +
"    for i=1,#r,8 do\n" +
"        local b8=string.sub(r,i,i+7)\n" +
"        if #b8==8 then\n" +
"            local n=0\n" +
"            for k=1,8 do\n" +
"                n=n*2+(string.sub(b8,k,k)=='1' and 1 or 0)\n" +
"            end\n" +
"            o=o..string.char(n)\n" +
"        end\n" +
"    end\n" +
"    return o\n" +
"end\n" +
"\n" +
"local function x1(d,k)\n" +
"    local o=''\n" +
"    for i=1,#d do\n" +
"        o=o..string.char(bit32.bxor(string.byte(d,i),string.byte(k,(i-1)%#k+1)))\n" +
"    end\n" +
"    return o\n" +
"end\n" +
"\n" +
"local k=d1('" + key1B64 + "')\n" +
"local d=d1('" + enc1B64 + "')\n" +
"loadstring(x1(d,k))()";
    
    // 第二层加密
    let key2 = randomKey(24);
    let enc2 = xorEncrypt(layer2, key2);
    let enc2B64 = b64e(enc2);
    let key2B64 = b64e(key2);
    
    // 第三层（最终输出）
    let final = 
"local function d0(s)\n" +
"    local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'\n" +
"    local t={}\n" +
"    for i=1,#b do t[string.sub(b,i,i)]=i-1 end\n" +
"    local r=''\n" +
"    for i=1,#s do\n" +
"        local c=string.sub(s,i,i)\n" +
"        if c=='=' then break end\n" +
"        local v=t[c] or 0\n" +
"        for j=5,0,-1 do\n" +
"            r=r..(bit32.band(bit32.rshift(v,j),1))\n" +
"        end\n" +
"    end\n" +
"    local o=''\n" +
"    for i=1,#r,8 do\n" +
"        local b8=string.sub(r,i,i+7)\n" +
"        if #b8==8 then\n" +
"            local n=0\n" +
"            for k=1,8 do\n" +
"                n=n*2+(string.sub(b8,k,k)=='1' and 1 or 0)\n" +
"            end\n" +
"            o=o..string.char(n)\n" +
"        end\n" +
"    end\n" +
"    return o\n" +
"end\n" +
"\n" +
"local function x0(d,k)\n" +
"    local o=''\n" +
"    for i=1,#d do\n" +
"        o=o..string.char(bit32.bxor(string.byte(d,i),string.byte(k,(i-1)%#k+1)))\n" +
"    end\n" +
"    return o\n" +
"end\n" +
"\n" +
"local k=d0('" + key2B64 + "')\n" +
"local d=d0('" + enc2B64 + "')\n" +
"loadstring(x0(d,k))()";

    document.getElementById("output").value = final;
};