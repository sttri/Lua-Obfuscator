document.getElementById("run").onclick = function () {
    let code = document.getElementById("input").value;
    if (!code.trim()) return alert("请输入代码");

    code = generateJunk() + renameLocals(code) + generateJunk();
    
    // 第一层加密
    let key1 = randomKey();
    let enc1 = xorEncrypt(code, key1);
    let enc1B64 = b64e(enc1);
    let key1B64 = b64e(key1);
    
    // 第二层包裹解密逻辑 - 使用单引号避免转义问题
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
    
    // 第三层（最终输出）- 使用字符串拼接避免转义问题
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