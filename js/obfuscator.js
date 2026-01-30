function renameLocals(code){
    const map = {};

    let newCode = code.replace(/\blocal\s+([a-zA-Z_]\w*)\s*=\s*(?!function)/g, (m, name) => {
        if(!map[name]){
            map[name] = "_" + Math.random().toString(36).slice(2,10);
        }
        return "local " + map[name] + "=";
    }).replace(/\b([a-zA-Z_]\w*)\b/g, (m, name) => {
        return map[name] || name;
    });
    
    newCode = newCode.replace(/\s+/g, ' ').trim();
    
    newCode = newCode.replace(/;(?=[a-zA-Z_])/g, '; ');
    
    return newCode;
}