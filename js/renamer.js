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

    let result = ""
    let i = 0
    let inString = false
    let stringChar = ""
    let inComment = false

    while (i < code.length) {
        const c = code[i]
        const next = code[i+1]

        // 进入字符串
        if (!inComment && (c === '"' || c === "'")) {
            inString = true
            stringChar = c
            result += c
            i++
            continue
        }

        // 退出字符串
        if (inString) {
            result += c
            if (c === stringChar && code[i-1] !== "\\") {
                inString = false
            }
            i++
            continue
        }

        // 单行注释 --
        if (!inString && c === "-" && next === "-") {
            inComment = true
            result += c
            i++
            continue
        }

        if (inComment) {
            result += c
            if (c === "\n") inComment = false
            i++
            continue
        }

        // 识别变量名
        if (/[a-zA-Z_]/.test(c)) {
            let start = i
            while (i < code.length && /[a-zA-Z0-9_]/.test(code[i])) i++
            const word = code.slice(start, i)

            const prevChar = code[start - 1]

            if (
                RESERVED.has(word) ||          // 保留字
                prevChar === "." ||            // 字段
                prevChar === ":"               // 方法
            ) {
                result += word
            } else {
                if (!map[word]) map[word] = rand()
                result += map[word]
            }

            continue
        }

        result += c
        i++
    }

    return result
}