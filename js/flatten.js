function flattenControlFlow(code){
    let lines = code.split("\n");
    let safe = [];

    let buffer = "";
    let depth = 0;

    for(let line of lines){
        let t = line.trim();

        // 检测结构块开始
        if(t.match(/^(function|if|for|while|repeat)/)) depth++;
        if(t.match(/^end\b/) || t.match(/^until\b/)) depth--;

        buffer += line + "\n";

        // 只在结构闭合时切块
        if(depth === 0 && buffer.trim() !== ""){
            safe.push(buffer.trim());
            buffer = "";
        }
    }

    if(safe.length < 2) return code; // 太短就不扁平化

    let states = [];
    for(let i=0;i<safe.length;i++){
        let next = (i === safe.length-1) ? "break" : `_s=${i+2}`;
        states.push(`elseif _s==${i+1} then ${safe[i]} ${next}`);
    }

    return `
local _s=1
while true do
${states.join("\n")}
end
`;
}