function flattenControlFlow(code){
    // 按行粗略拆分（避免破坏结构块）
    let lines = code.split("\n").filter(l=>l.trim()!=="");
    let states = [];

    for(let i=0;i<lines.length;i++){
        let next = (i === lines.length-1) ? "break" : `_s=${i+2}`;
        states.push(`elseif _s==${i+1} then ${lines[i]} ${next}`);
    }

    return `
local _s=1
while true do
${states.join("\n")}
end
`;
}