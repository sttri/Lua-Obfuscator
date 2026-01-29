export function encodeStrings(code){
    return code.replace(/(["'])(.*?)\1/g,(m,q,str)=>{
        let arr = []
        for(let i=0;i<str.length;i++)
            arr.push(str.charCodeAt(i)^23)

        return `(function() local t={${arr.join(",")}} local s='' for i=1,#t do s=s..string.char(bit32.bxor(t[i],23)) end return s end)()`
    })
}