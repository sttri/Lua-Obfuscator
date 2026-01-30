document.getElementById("run").onclick=function(){
    let code=document.getElementById("input").value;
    if(!code.trim()) return alert("请输入代码");

    // 第一层：源码混淆
    code = generateJunk() + renameLocals(code) + generateJunk();

    // 第二层：XOR 加密
    let key = randomKey();
    let encrypted = xorEncrypt(code,key);

    let encryptedB64 = b64e(encrypted);
    let keyB64 = b64e(key);

    // 第二层 Lua 解密壳
    let luaStub = buildLuaStub(encryptedB64,keyB64);

    // 第三层：把“解密壳”再 Base64 包裹
    let final = `
local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local function d(data)
 data=string.gsub(data,'[^'..b..'=]','')
 return (data:gsub('.',function(x)
  if(x=='=')then return''end
  local r,f='',(b:find(x)-1)
  for i=6,1,-1 do r=r..(f%2^i-f%2^(i-1)>0 and'1'or'0')end
  return r
 end):gsub('%d%d%d?%d?%d?%d?%d?%d?',function(x)
  if(#x~=8)then return''end
  local c=0
  for i=1,8 do c=c+(x:sub(i,i)=='1'and2^(8-i)or0)end
  return string.char(c)
 end))
end
loadstring(d("${b64e(luaStub)}"))()
`;

    document.getElementById("output").value = final;
}