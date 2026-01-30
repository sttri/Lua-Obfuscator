function b64e(str){return btoa(unescape(encodeURIComponent(str)));}

function buildLuaStub(encB64,keyB64){
return `
local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local function d(data)
 data=string.gsub(data,'[^'..b..'=]','')
 return (data:gsub('.',function(x)
  if(x=='=') then return '' end
  local r,f='',(b:find(x)-1)
  for i=6,1,-1 do
   r=r..(f%2^i - f%2^(i-1) > 0 and '1' or '0')
  end
  return r
 end):gsub('%d%d%d?%d?%d?%d?%d?%d?',function(x)
  if(#x~=8) then return '' end
  local c=0
  for i=1,8 do
   c=c+(x:sub(i,i)=='1' and 2^(8-i) or 0)
  end
  return string.char(c)
 end))
end

local key=d("${keyB64}")
local data=d("${encB64}")
local out=""
for i=1,#data do
 out=out..string.char(bit32.bxor(data:byte(i), key:byte((i-1)%#key+1)))
end
loadstring(out)()
`;
}