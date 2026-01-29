export function vmProtect(code){
    const escaped = code.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n")

    return `
local function VMRun()
    local src = "${escaped}"
    local f = loadstring(src)
    return f()
end
VMRun()
`
}