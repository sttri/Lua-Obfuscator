export function renameVars(code){
    const keywords = ["local","function","end","if","then","else","elseif","for","while","do","repeat","until","return"]
    const map = {}
    const rand = () => "_" + Math.random().toString(36).substring(2,8)

    return code.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, w=>{
        if(keywords.includes(w)) return w
        if(!map[w]) map[w] = rand()
        return map[w]
    })
}