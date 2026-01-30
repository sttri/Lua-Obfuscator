document.getElementById("run").onclick = function () {
    let code = document.getElementById("input").value;
    if (!code.trim()) return alert("请输入代码");

    const frontJunk = generateMassiveJunkLines(300);
    const backJunk = generateMassiveJunkLines(300);

    code = frontJunk + code + backJunk;
    
    code = generateJunk() + " " + renameLocals(code) + " " + generateJunk();
    
    let key = randomKey();
    let encrypted = xorEncrypt(code, key);
    let encryptedB64 = b64e(encrypted);
    let keyB64 = b64e(key);
    
    let luaStub = `local function xorDecrypt(data,key) local out="" for i=1,#data do out=out..string.char(bit32.bxor(data:byte(i),key:byte((i-1)%#key+1))) end return out end local function simpleBase64Decode(str) local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/' str=string.gsub(str,'[^'..b..'=]','') local function charToBits(x) if x=='=' then return '' end local f=b:find(x)-1 local r='' for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and '1' or '0') end return r end local function bitsToChar(x) if #x~=8 then return '' end local c=0 for i=1,8 do c=c+(x:sub(i,i)=='1' and 2^(8-i) or 0) end return string.char(c) end local bits=str:gsub('.',charToBits) return bits:gsub('%d%d%d?%d?%d?%d?%d?%d?',bitsToChar) end local key=simpleBase64Decode("${keyB64}") local data=simpleBase64Decode("${encryptedB64}") local out=xorDecrypt(data,key) loadstring(out)()`;

    let stubKey = randomKey(32);
    let encryptedStub = xorEncrypt(luaStub, stubKey);
    let encryptedStubB64 = b64e(encryptedStub);
    let stubKeyB64 = b64e(stubKey);
    
    let final = `local function xorDecrypt(data,key) local out="" for i=1,#data do out=out..string.char(bit32.bxor(data:byte(i),key:byte((i-1)%#key+1))) end return out end local function simpleBase64Decode(str) local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/' str=string.gsub(str,'[^'..b..'=]','') local function charToBits(x) if x=='=' then return '' end local f=b:find(x)-1 local r='' for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and '1' or '0') end return r end local function bitsToChar(x) if #x~=8 then return '' end local c=0 for i=1,8 do c=c+(x:sub(i,i)=='1' and 2^(8-i) or 0) end return string.char(c) end local bits=str:gsub('.',charToBits) return bits:gsub('%d%d%d?%d?%d?%d?%d?%d?',bitsToChar) end local stubKey=simpleBase64Decode("${stubKeyB64}") local stubEnc=simpleBase64Decode("${encryptedStubB64}") local realStub=xorDecrypt(stubEnc,stubKey) loadstring(realStub)()`;

    const finalFrontJunk = generateMassiveJunkLines(200);
    const finalBackJunk = generateMassiveJunkLines(200);
    
    let finalWithJunk = finalFrontJunk + final + finalBackJunk;
    
    finalWithJunk = finalWithJunk.replace(/\s+/g, ' ').trim();
    
    document.getElementById("output").value = finalWithJunk;
};