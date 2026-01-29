// vm.js
export function vmProtect(code){
    // 将代码转为字节序列
    let bytes = []
    for(let i=0; i<code.length; i++){
        bytes.push(code.charCodeAt(i))
    }
    
    // 随机加密
    const key1 = Math.floor(Math.random() * 256)
    const key2 = Math.floor(Math.random() * 256)
    
    let encrypted = []
    for(let i=0; i<bytes.length; i++){
        encrypted.push(bytes[i] ^ key1 ^ (key2 * (i+1)) % 256)
    }
    
    return `local function _V()
    local _b = {${encrypted.join(",")}}
    local _k1 = ${key1}
    local _k2 = ${key2}
    local _c = ""
    for _n = 1, #_b do
        _c = _c .. string.char((_b[_n] ~ _k1 ~ (_k2 * _n) % 256 + 256) % 256)
    end
    local _f, _e = loadstring(_c)
    if not _f then error(_e) end
    return _f()
end
_V()`
}