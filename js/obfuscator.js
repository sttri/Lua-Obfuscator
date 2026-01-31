function renameLocals(code) {
    // Luau 关键字
    const keywords = new Set([
        'and', 'break', 'do', 'else', 'elseif', 'end', 'false', 'for', 'function',
        'if', 'in', 'local', 'nil', 'not', 'or', 'repeat', 'return', 'then',
        'true', 'until', 'while', 'goto', 'continue'
    ]);
    
    // Roblox 全局对象（不重命名）
    const globals = new Set([
        'game', 'workspace', 'Players', 'script', 'shared', 'require',
        'print', 'warn', 'error', 'wait', 'delay', 'spawn', 'tick', 'time',
        'loadstring', 'typeof', 'type', 'assert', 'pcall', 'xpcall',
        'getfenv', 'setfenv', 'rawequal', 'rawget', 'rawset', 'select',
        'tonumber', 'tostring', 'unpack', 'string', 'table', 'math', 
        'coroutine', 'os', 'debug', 'bit32', 'utf8', 'Vector3', 'CFrame',
        'UDim2', 'UDim', 'BrickColor', 'Color3', 'ColorSequence', 'NumberSequence',
        'Ray', 'Rect', 'Region3', 'TweenInfo', 'Enum', 'Instance', 'settings'
    ]);
    
    const map = {};
    const usedNames = new Set();
    const protectedNames = new Set([...keywords, ...globals]);
    
    // 第一步：保护字符串和注释
    const stringMatches = [];
    const commentMatches = [];
    
    // 1. 保护多行字符串和注释
    let protectedCode = code.replace(/--\[\[[\s\S]*?\]\]/g, (match) => {
        commentMatches.push(match);
        return `__COMMENT_${commentMatches.length - 1}__`;
    });
    
    // 2. 保护单行注释
    protectedCode = protectedCode.replace(/--[^\n]*/g, (match) => {
        commentMatches.push(match);
        return `__COMMENT_${commentMatches.length - 1}__`;
    });
    
    // 3. 保护字符串（正确处理转义）
    protectedCode = protectedCode.replace(/(["'])(?:\\.|(?!\1).)*?\1/g, (match) => {
        stringMatches.push(match);
        return `__STRING_${stringMatches.length - 1}__`;
    });
    
    // 4. 保护点表示法（如 Library.Options）
    protectedCode = protectedCode.replace(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, obj, prop) => {
        // 标记但不替换，因为可能包含需要重命名的变量
        return `__DOT_${obj}__.__DOT_${prop}__`;
    });
    
    // 第二步：分析并重命名局部变量
    const lines = protectedCode.split('\n');
    const processedLines = [];
    
    // 正则表达式匹配各种局部变量声明
    const patterns = [
        // local var = value
        /^(\s*)local\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(=.*)?$/,
        // local var1, var2 = value1, value2
        /^(\s*)local\s+([a-zA-Z_][a-zA-Z0-9_]*\s*,\s*[a-zA-Z_][a-zA-Z0-9_]*)\s*(=.*)?$/,
        // function params
        /^(\s*)function\s+([a-zA-Z_][a-zA-Z0-9_]*)?\s*\(([^)]*)\)/,
        // for loop vars
        /^(\s*)for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:,\s*([a-zA-Z_][a-zA-Z0-9_]*))?\s+in\s+/,
        // numeric for
        /^(\s*)for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*[^,]+,\s*[^,]+(?:\s*,\s*[^,]+)?\s+do/
    ];
    
    for (let line of lines) {
        let processedLine = line;
        
        // 处理局部变量声明
        for (const pattern of patterns) {
            const match = processedLine.match(pattern);
            if (match) {
                if (pattern.toString().includes('function')) {
                    // 处理函数参数
                    const indent = match[1];
                    const funcName = match[2] || '';
                    const params = match[3] || '';
                    
                    if (params.trim()) {
                        const paramList = params.split(',').map(p => p.trim());
                        const renamedParams = paramList.map(param => {
                            if (param && !protectedNames.has(param) && !param.includes('...')) {
                                if (!map[param]) {
                                    let newName;
                                    do {
                                        newName = '_' + Math.random().toString(36).slice(2, 10);
                                    } while (usedNames.has(newName));
                                    map[param] = newName;
                                    usedNames.add(newName);
                                }
                                return map[param];
                            }
                            return param;
                        });
                        
                        processedLine = indent + 'function ' + (funcName || '') + 
                                      '(' + renamedParams.join(', ') + ')';
                    }
                } else {
                    // 处理普通局部变量
                    const indent = match[1];
                    const varsStr = match[2];
                    const assignment = match[3] || '';
                    
                    const vars = varsStr.split(',').map(v => v.trim()).filter(v => v);
                    const renamedVars = vars.map(varName => {
                        if (!protectedNames.has(varName)) {
                            if (!map[varName]) {
                                let newName;
                                do {
                                    newName = '_' + Math.random().toString(36).slice(2, 10);
                                } while (usedNames.has(newName));
                                map[varName] = newName;
                                usedNames.add(newName);
                            }
                            return map[varName];
                        }
                        return varName;
                    });
                    
                    processedLine = indent + 'local ' + renamedVars.join(', ') + assignment;
                }
                break;
            }
        }
        
        processedLines.push(processedLine);
    }
    
    // 第三步：替换变量引用
    let result = processedLines.join('\n');
    
    // 按变量名长度降序排序，避免部分替换
    const sortedKeys = Object.keys(map).sort((a, b) => b.length - a.length);
    
    for (const oldName of sortedKeys) {
        const newName = map[oldName];
        // 使用单词边界，但排除点表示法的情况
        const regex = new RegExp(`\\b${oldName}\\b(?![.])`, 'g');
        result = result.replace(regex, newName);
    }
    
    // 第四步：恢复保护的内容
    // 恢复点表示法
    result = result.replace(/__DOT_([a-zA-Z_][a-zA-Z0-9_]*)__\.__DOT_([a-zA-Z_][a-zA-Z0-9_]*)__/g, (match, obj, prop) => {
        // 检查是否需要重命名对象部分
        const renamedObj = map[obj] || obj;
        const renamedProp = map[prop] || prop;
        return `${renamedObj}.${renamedProp}`;
    });
    
    // 恢复字符串
    for (let i = stringMatches.length - 1; i >= 0; i--) {
        result = result.replace(`__STRING_${i}__`, stringMatches[i]);
    }
    
    // 恢复注释
    for (let i = commentMatches.length - 1; i >= 0; i--) {
        result = result.replace(`__COMMENT_${i}__`, commentMatches[i]);
    }
    
    return result;
}