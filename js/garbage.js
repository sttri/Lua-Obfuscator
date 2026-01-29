export function injectGarbageFlood(code){
    function junk(){
        let a = Math.floor(Math.random()*9999)
        return `
local _g${a} = ${a}
if _g${a} % 3 == 1 then
    local _t = {}
    for i=1,10 do _t[i]=i*_g${a}%7 end
end`
    }

    let flood = ""
    for(let i=0;i<8;i++) flood += junk()
    return flood + "\n" + code + "\n" + flood
}