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

    return code.replace(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g, (word, offset) => {

        // 不混淆保留字
        if (RESERVED.has(word)) return word

        // 🔥 关键修复：如果前面是 "." 或 ":" 就是字段/方法名，不动
        const prevChar = code[offset - 1]
        if (prevChar === "." || prevChar === ":") return word

        // 正常变量才混淆
        if (!map[word]) map[word] = rand()
        return map[word]
    })
}
