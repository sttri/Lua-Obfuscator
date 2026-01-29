export function vmProtect(code){
    const escaped = code
        .replace(/\\/g,"\\\\")
        .replace(/"/g,'\\"')
        .replace(/\n/g,"\\n")

    return `
local function VMRun()
    local src = "${escaped}"
    local f, err = loadstring(src)

    if not f then
        warn("Load error:", err)
        return
    end

    local ok, res = pcall(f)
    if not ok then
        warn("Runtime error:", res)
    end
end

VMRun()
`
}