function generateJunk(){
    return `
local function _${Math.random().toString(36).slice(2,8)}()
    local a=${Math.floor(Math.random()*9999)}
    return a*0
end
`;
}