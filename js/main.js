window.addEventListener("DOMContentLoaded", function(){

// ====== 你原来的代码从这里开始 ======

document.getElementById("run").onclick = function () {
    let code = document.getElementById("input").value;
    if (!code.trim()) return alert("请输入代码");

    let key = randomKey();

    code = generateJunk() + renameLocals(code) + generateJunk();
    code = encryptLuaStrings(code, key);

    let encryptedB64 = xorEncrypt(code, key);
    let keyB64 = btoa(key);

    let luaStub = buildLuaStub(encryptedB64, keyB64);

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

// ====== 你原来的代码到这里结束 ======

});