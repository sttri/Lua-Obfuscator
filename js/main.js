document.getElementById("run").onclick = function () {
    let code = document.getElementById("input").value;
    if (!code.trim()) return alert("请输入代码");

    code = generateJunk() + renameLocals(code) + generateJunk();
    
    // 第一层加密
    let key1 = randomKey();
    let enc1 = xorEncrypt(code, key1);
    let enc1B64 = b64e(enc1);
    let key1B64 = b64e(key1);
    
    // 第二层包裹解密逻辑
    let layer2 = `
local function d1(s)
    local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    s=s:gsub('[^'..b..'=]','')
    local r=''
    for i=1,#s do
        local c=s:sub(i,i)
        if c=='=' then break end
        local v=b:find(c)-1
        for j=5,0,-1 do
            r=r..((v>>j)&1)
        end
    end
    local o=''
    for i=1,#r,8 do
        local b8=r:sub(i,i+7)
        if #b8==8 then
            local n=0
            for k=1,8 do
                n=n*2+(b8:sub(k,k)=='1'and 1 or 0)
            end
            o=o..string.char(n)
        end
    end
    return o
end

local function x1(d,k)
    local o=''
    for i=1,#d do
        o=o..string.char(bit32.bxor(d:byte(i),k:byte((i-1)%#k+1)))
    end
    return o
end

local k=d1("${key1B64}")
local d=d1("${enc1B64}")
loadstring(x1(d,k))()
`;
    
    let key2 = randomKey(24);
    let enc2 = xorEncrypt(layer2, key2);
    let enc2B64 = b64e(enc2);
    let key2B64 = b64e(key2);
    
    // 第三层（最终输出）
    let final = `
local function d0(s)
    local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    local t={}
    for i=1,#b do t[b:sub(i,i)]=i-1 end
    local r=''
    for i=1,#s do
        local c=s:sub(i,i)
        if c=='=' then break end
        local v=t[c]or 0
        for j=5,0,-1 do
            r=r..((v>>j)&1)
        end
    end
    local o=''
    for i=1,#r,8 do
        local b8=r:sub(i,i+7)
        if #b8==8 then
            local n=0
            for k=1,8 do
                n=n*2+(b8:sub(k,k)=='1'and 1 or 0)
            end
            o=o..string.char(n)
        end
    end
    return o
end

local function x0(d,k)
    local o=''
    for i=1,#d do
        o=o..string.char(bit32.bxor(d:byte(i),k:byte((i-1)%#k+1)))
    end
    return o
end

local k=d0("${key2B64}")
local d=d0("${enc2B64}")
loadstring(x0(d,k))()
`;

    document.getElementById("output").value = final;
};