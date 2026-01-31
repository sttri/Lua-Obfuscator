document.getElementById("run").onclick = function () {
    let code = document.getElementById("input").value;
    if (!code.trim()) return alert("请输入代码");

    // 第一层：重命名 + 垃圾代码
    code = generateJunk() + renameLocals(code) + generateJunk();

    // 1. 准备解密器的 Lua 源码（这是我们想隐藏的）
    const decryptorLua = `
return function(data, key)
    local out = ""
    for i = 1, #data do
        out = out .. string.char(bit32.bxor(data:byte(i), key:byte((i-1) % #key + 1)))
    end
    return out
end
`;

    const base64DecoderLua = `
return function(str)
    local b = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    str = string.gsub(str, '[^'..b..'=]', '')
    local function charToBits(x)
        if x == '=' then return '' end
        local f = b:find(x) - 1
        local r = ''
        for i = 6, 1, -1 do
            r = r .. (f % 2^i - f % 2^(i-1) > 0 and '1' or '0')
        end
        return r
    end
    local function bitsToChar(x)
        if #x ~= 8 then return '' end
        local c = 0
        for i = 1, 8 do
            c = c + (x:sub(i,i) == '1' and 2^(8-i) or 0)
        end
        return string.char(c)
    end
    local bits = str:gsub('.', charToBits)
    return bits:gsub('%d%d%d?%d?%d?%d?%d?%d?', bitsToChar)
end
`;

    // 2. 将这些解密器源码先进行简单混淆，然后生成"加载器片段"
    // 每个片段只做一件事，最后组合
    
    // 阶段1: 解码 Base64（字节码形式）
    let stage1Code = `
local chunk = loadstring([[
    return function(str)
        local b = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
        str = string.gsub(str, '[^'..b..'=]', '')
        local function charToBits(x)
            if x == '=' then return '' end
            local f = b:find(x) - 1
            local r = ''
            for i = 6, 1, -1 do
                r = r .. (f % 2^i - f % 2^(i-1) > 0 and '1' or '0')
            end
            return r
        end
        local function bitsToChar(x)
            if #x ~= 8 then return '' end
            local c = 0
            for i = 1, 8 do
                c = c + (x:sub(i,i) == '1' and 2^(8-i) or 0)
            end
            return string.char(c)
        end
        local bits = str:gsub('.', charToBits)
        return bits:gsub('%d%d%d?%d?%d?%d?%d?%d?', bitsToChar)
    end
]])()
]]);

    let stage2Code = `
local chunk = loadstring([[
    return function(data, key)
        local out = ""
        for i = 1, #data do
            out = out .. string.char(bit32.bxor(data:byte(i), key:byte((i-1) % #key + 1)))
        end
        return out
    end
]])()
]]);

    // 3. 加密真实代码
    let codeKey = randomKey();
    let encryptedCode = xorEncrypt(code, codeKey);
    let encryptedCodeB64 = b64e(encryptedCode);
    let codeKeyB64 = b64e(codeKey);

    // 4. 生成最终的保护代码（使用间接执行）
    let finalOutput = `
-- 第一阶段：硬编码的微型加载器
local function tinyBase64Decode(s)
    local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    s=string.gsub(s,'[^'..b..'=]','')
    return (s:gsub('.',function(x)
        if(x=='=')then return '' end
        local r,f='',b:find(x)-1
        for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and'1'or'0')end
        return r
    end):gsub('%d%d%d?%d?%d?%d?%d?%d?',function(x)
        if(#x~=8)then return''end
        local c=0
        for i=1,8 do c=c+(x:sub(i,i)=='1'and 2^(8-i)or 0)end
        return string.char(c)
    end))
end

local function tinyXOR(data,key)
    local out=""
    for i=1,#data do
        out=out..string.char(bit32.bxor(data:byte(i),key:byte((i-1)%#key+1)))
    end
    return out
end

local encDecryptor1="${b64e(xorEncrypt(base64DecoderLua, "DEC1"))}"
local key1="${b64e("DEC1")}"

local encDecryptor2="${b64e(xorEncrypt(decryptorLua, "DEC2"))}"
local key2="${b64e("DEC2")}"

local fullB64Dec = loadstring(tinyXOR(tinyBase64Decode(encDecryptor1), tinyBase64Decode(key1)))()
local fullXORDec = loadstring(tinyXOR(tinyBase64Decode(encDecryptor2), tinyBase64Decode(key2)))()

local realCodeEnc="${encryptedCodeB64}"
local realCodeKey="${codeKeyB64}"

local realCode = fullXORDec(fullB64Dec(realCodeEnc), fullB64Dec(realCodeKey))

loadstring(realCode)()
`;

    // 5. 对最终输出再进行一次简单混淆（可选）
    // 这里可以添加额外的代码变换，如变量名混淆、控制流平坦化等
    
    document.getElementById("output").value = finalOutput;
};
[file content end]