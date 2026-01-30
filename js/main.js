document.getElementById("run").onclick=function(){
    let code=document.getElementById("input").value;
    if(!code.trim()) return alert("请输入代码");

    // ① 变量混淆 + 垃圾代码
    code = generateJunk() + renameLocals(code) + generateJunk();

    // ② 控制流扁平化（新增）
    code = flattenControlFlow(code);

    // ③ XOR 加密源码
    let key = randomKey();
    let encrypted = xorEncrypt(code,key);

    let encryptedB64 = b64e(encrypted);
    let keyB64 = b64e(key);

    // ④ 第二层 Lua 解密壳
    let luaStub = buildLuaStub(encryptedB64,keyB64);

    // ⑤ 第三层：解密壳再 Base64 包裹
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

loadstring(d("${b64e(luaStub)}"))()
`;