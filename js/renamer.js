const RESERVED = new Set([
    // Lua keywords
    "and","break","do","else","elseif","end","false","for","function","if","in",
    "local","nil","not","or","repeat","return","then","true","until","while",

    // Roblox / Lua globals
    "game","workspace","script","Instance","Vector3","CFrame","Color3",
    "pairs","ipairs","next","print","warn","error","require",
    "math","string","table","bit32","utf8","coroutine","task","tick","time",
    "wait","spawn","delay","pcall","xpcall","setmetatable","getmetatable",
    "_G","shared","loadstring","tonumber","tostring","type"
])

export function renameVars(code){
    const map = {}
    const rand = () => "_" + Math.random().toString(36).substring(2,10)

    return code.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, w=>{
        if (RESERVED.has(w)) return w
        if (!map[w]) map[w] = rand()
        return map[w]
    })
}