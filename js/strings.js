export function encodeStrings(code){
    return code.replace(/(["'])(.*?)\1/g,(m,q,str)=>{
        let arr = []
        const key = Math.floor(Math.random() * 256)
        
        for(let i=0;i<str.length;i++)
            arr.push(str.charCodeAt(i) ^ key)

        const arrName = '_a' + Math.random().toString(36).substr(2,6)
        const resName = '_r' + Math.random().toString(36).substr(2,6)
        const idxName = '_i' + Math.random().toString(36).substr(2,4)
        const keyName = '_k' + Math.random().toString(36).substr(2,4)
        
        return `(function()
            local ${arrName} = {${arr.join(",")}}
            local ${resName} = ""
            local ${keyName} = ${key}
            local ${idxName} = 1
            while ${idxName} <= #${arrName} do
                ${resName} = ${resName} .. string.char(bit32.bxor(${arrName}[${idxName}], ${keyName}))
                ${idxName} = ${idxName} + 1
            end
            return ${resName}
        end)()`
    })
}