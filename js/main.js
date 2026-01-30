document.getElementById("run").onclick = function () {
    let code = document.getElementById("input").value;
    if (!code.trim()) return alert("请输入代码");

    // ✅ 先生成密钥（后面所有加密统一用它）
    let key = randomKey();

    // ① 变量混淆 + 垃圾代码
    code = generateJunk() + renameLocals(code) + generateJunk();

    // ② 字符串加密（现在 key 已经存在了）
    code = encryptLuaStrings(code, key);

    // ③ 整体源码 XOR 加密
    let encryptedB64 = xorEncrypt(code, key); // 你这个函数本身就会 btoa

    let keyB64 = btoa(key);

    // ④ 第二层 Lua 解密壳（你原来的函数）
    let luaStub = buildLuaStub(encryptedB64, keyB64);

    // ⑤ 第三层外壳（你原来的）
    let final = `
local b = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local function d(data)
    data = string.gsub(data, '[^'..b..'=]', '')
    return (data:gsub('.', function(x)
        if (x == '=') then return '' end
        local r, f = '', (b:find(x) - 1)
        for i = 6, 1, -1 do
            r = r .. (f % 2^i - f % 2^(i-1) > 0 and '1' or '0')
        end
        return r
    end):gsub('%d%d%d?%d?%d?%d?%d?%d?', function(x)
        if (#x ~= 8) then return '' end
        local c = 0
        for i = 1, 8 do
            c = c + (x:sub(i,i) == '1' and 2^(8-i) or 0)
        end
        return string.char(c)
    end))
end

loadstring(d("${btoa(luaStub)}"))()
`;

    document.getElementById("output").value = final;
};