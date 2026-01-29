export function flattenControlFlow(code){
    return `
local _state = 0
while true do
    if _state == 0 then
        _state = 1
    elseif _state == 1 then
        ${code.replace(/\n/g," ")}
        _state = 2
    elseif _state == 2 then
        break
    end
end`
}