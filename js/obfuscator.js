function renameLocals(code){
    // Luau 关键字列表
    const luauKeywords = new Set([
        'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
        'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
        'true', 'until', 'while', 'goto', 'continue', 'type', 'typeof'
    ]);
    
    const map = {};
    const lines = code.split('\n');
    const processedLines = [];
    
    // 第一阶段：识别并替换局部变量声明
    for (let line of lines) {
        // 跳过注释行
        if (line.trim().startsWith('--')) {
            processedLines.push(line);
            continue;
        }
        
        // 处理局部变量声明
        const match = line.match(/^(\s*)local\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(=.*)?$/);
        if (match && !luauKeywords.has(match[2])) {
            const indent = match[1];
            const varName = match[2];
            
            if (!map[varName]) {
                // 生成更安全的变量名（避免数字开头）
                map[varName] = "_" + Math.random().toString(36).slice(2, 10);
            }
            
            processedLines.push(indent + 'local ' + map[varName] + (match[3] || ''));
            continue;
        }
        
        // 处理多个局部变量声明，如：local a, b, c = 1, 2, 3
        const multiMatch = line.match(/^(\s*)local\s+([a-zA-Z_][a-zA-Z0-9_]*\s*(?:,\s*[a-zA-Z_][a-zA-Z0-9_]*)*)\s*(=.*)?$/);
        if (multiMatch) {
            const indent = multiMatch[1];
            const varsStr = multiMatch[2];
            const assignment = multiMatch[3] || '';
            
            const vars = varsStr.split(',').map(v => v.trim()).filter(v => v);
            const renamedVars = vars.map(varName => {
                if (luauKeywords.has(varName)) return varName;
                if (!map[varName]) {
                    map[varName] = "_" + Math.random().toString(36).slice(2, 10);
                }
                return map[varName];
            }).join(', ');
            
            processedLines.push(indent + 'local ' + renamedVars + assignment);
            continue;
        }
        
        processedLines.push(line);
    }
    
    // 第二阶段：替换代码中的变量引用
    const finalLines = [];
    for (let line of processedLines) {
        let processedLine = line;
        
        // 按长度降序排序，避免部分替换
        const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);
        
        for (const oldName of sortedKeys) {
            const newName = map[oldName];
            // 使用单词边界确保只替换完整的变量名
            const regex = new RegExp(`\\b${oldName}\\b`, 'g');
            processedLine = processedLine.replace(regex, newName);
        }
        
        finalLines.push(processedLine);
    }
    
    return finalLines.join('\n');
}