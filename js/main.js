document.getElementById("run").onclick = function () {
    let code = document.getElementById("input").value;
    if (!code.trim()) {
        alert("请输入代码");
        return;
    }

    // 第一步：生成垃圾代码和重命名变量
    code = generateJunk() + renameLocals(code) + generateJunk();
    
    // 生成随机密钥
    let codeKey = randomKey();
    
    // 加密代码
    let encryptedCode = xorEncrypt(code, codeKey);
    let encryptedCodeB64 = b64e(encryptedCode);
    let codeKeyB64 = b64e(codeKey);
    
    // 准备两个解密器的源码（我们将加密它们）
    const base64DecoderLua = `return function(str)
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
end`;

    const xorDecryptorLua = `return function(data, key)
    local out = ""
    for i = 1, #data do
        out = out .. string.char(bit32.bxor(data:byte(i), key:byte((i-1) % #key + 1)))
    end
    return out
end`;

    // 加密这两个解密器
    let b64Key = randomKey(8);
    let xorKey = randomKey(8);
    
    let encryptedB64Decoder = xorEncrypt(base64DecoderLua, b64Key);
    let encryptedXORDecryptor = xorEncrypt(xorDecryptorLua, xorKey);
    
    let encB64DecoderB64 = b64e(encryptedB64Decoder);
    let encXORDecryptorB64 = b64e(encryptedXORDecryptor);
    let b64KeyB64 = b64e(b64Key);
    let xorKeyB64 = b64e(xorKey);
    
    // 生成最终的混淆代码
    let finalOutput = `-- 微型启动器（最小化，这是唯一明文的解密器）
local function mB64(s)
    local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    s=string.gsub(s,'[^'..b..'=]','')
    return (s:gsub('.',function(x)
        if x=='='then return''end
        local r,f='',b:find(x)-1
        for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and'1'or'0')end
        return r
    end):gsub('%d%d%d?%d?%d?%d?%d?%d?',function(x)
        if #x~=8 then return''end
        local c=0
        for i=1,8 do c=c+(x:sub(i,i)=='1'and 2^(8-i)or 0)end
        return string.char(c)
    end))
end

local function mXOR(d,k)
    local o=""
    for i=1,#d do
        o=o..string.char(bit32.bxor(d:byte(i),k:byte((i-1)%#k+1)))
    end
    return o
end

-- 加密的解密器数据
local e1="${encB64DecoderB64}"
local k1="${b64KeyB64}"
local e2="${encXORDecryptorB64}"
local k2="${xorKeyB64}"

-- 第一步：用微型解密器解密出完整解密器
local b64DecFunc = loadstring(mXOR(mB64(e1), mB64(k1)))()
local xorDecFunc = loadstring(mXOR(mB64(e2), mB64(k2)))()

-- 第二步：用完整解密器解密真实代码
local realCode = "${encryptedCodeB64}"
local realKey = "${codeKeyB64}"

local finalCode = xorDecFunc(b64DecFunc(realCode), b64DecFunc(realKey))

-- 执行最终代码
loadstring(finalCode)()`;

    // 设置输出
    document.getElementById("output").value = finalOutput;
    document.getElementById("output").style.height = "400px";
};
[file content end]