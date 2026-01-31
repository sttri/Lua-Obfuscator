document.getElementById("run").onclick = function () {
    let code = document.getElementById("input").value;
    if (!code.trim()) return alert("请输入代码");

    console.log("开始混淆处理...");
    
    // 1. 先进行重命名
    let renamedCode = renameLocals(code);
    console.log("重命名完成");
    
    // 2. 添加反调试和垃圾代码
    let antiDebug = `
-- 反调试保护
local _anti_debug_start = tick()
local _anti_debug_sum = 0
for _anti_debug_i = 1, 50 do
    _anti_debug_sum = _anti_debug_sum + math.random(1, 1000)
end
local _anti_debug_elapsed = tick() - _anti_debug_start
if _anti_debug_elapsed > 0.1 then
    return
end

-- 垃圾代码
local _junk_func_${Math.random().toString(36).slice(2, 8)} = function()
    local _junk_var_${Math.random().toString(36).slice(2, 8)} = ${Math.floor(Math.random() * 99999)}
    return _junk_var_${Math.random().toString(36).slice(2, 8)} * 0
end
_junk_func_${Math.random().toString(36).slice(2, 8)}()
`;

    // 3. 组合代码
    let finalCode = antiDebug + renamedCode;
    
    // 4. 分块处理（最多3块）
    const MAX_CHUNKS = 3;
    let chunks = [];
    
    if (finalCode.length <= 5000) {
        // 小代码不分块
        chunks = [finalCode];
    } else {
        // 智能分块：按行分块，不在表达式中间切割
        const lines = finalCode.split('\n');
        const linesPerChunk = Math.ceil(lines.length / MAX_CHUNKS);
        
        for (let i = 0; i < lines.length; i += linesPerChunk) {
            const chunkLines = lines.slice(i, Math.min(i + linesPerChunk, lines.length));
            chunks.push(chunkLines.join('\n'));
        }
    }
    
    console.log(`分块数量: ${chunks.length}`);
    
    // 5. 加密每个分块
    let chunkKeys = [];
    let encryptedChunks = [];
    
    for (let chunk of chunks) {
        let key = randomKey(24);
        chunkKeys.push(key);
        let encrypted = xorEncrypt(chunk, key);
        encryptedChunks.push(b64e(encrypted));
    }
    
    // 6. 生成解密器
    let decryptor = `
-- 加密混淆代码（${chunks.length}个分块）
local _b64_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local _b64_map = {}
for i = 1, 64 do _b64_map[_b64_chars:sub(i, i)] = i - 1 end

local function _b64_decode(s)
    s = string.gsub(s, '[^' .. _b64_chars .. '=]', '')
    local result = {}
    local bits = 0
    local bit_count = 0
    
    for i = 1, #s do
        local c = s:sub(i, i)
        if c == '=' then break end
        bits = bits * 64 + (_b64_map[c] or 0)
        bit_count = bit_count + 6
        
        if bit_count >= 8 then
            bit_count = bit_count - 8
            local byte = math.floor(bits / (2 ^ bit_count)) % 256
            table.insert(result, string.char(byte))
        end
    end
    return table.concat(result)
end

local function _xor_decrypt(data, key)
    local result = {}
    local key_len = #key
    for i = 1, #data do
        local data_byte = data:byte(i)
        local key_byte = key:byte((i - 1) % key_len + 1)
        table.insert(result, string.char(bit32.bxor(data_byte, key_byte)))
    end
    return table.concat(result)
end

-- 分块数据
local _chunks = {}
`;

    // 添加分块解密代码
    for (let i = 0; i < chunks.length; i++) {
        decryptor += `
-- 分块 ${i + 1}
do
    local _enc_data_${i} = [[${encryptedChunks[i]}]]
    local _enc_key_${i} = [[${b64e(chunkKeys[i])}]]
    local _data_${i} = _b64_decode(_enc_data_${i})
    local _key_${i} = _b64_decode(_enc_key_${i})
    _chunks[${i + 1}] = _xor_decrypt(_data_${i}, _key_${i})
end
`;
    }
    
    decryptor += `
-- 合并并执行
local _full_code = table.concat(_chunks)
local _success, _error = pcall(function()
    loadstring(_full_code)()
end)

if not _success then
    warn('执行错误:', _error)
end
`;

    // 7. 最终加密层
    let finalKey = randomKey(32);
    let finalEncrypted = xorEncrypt(decryptor, finalKey);
    let finalEncryptedB64 = b64e(finalEncrypted);
    let finalKeyB64 = b64e(finalKey);
    
    // 8. 生成最终输出
    let finalOutput = `
-- 最终加密层
local _final_b64_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local _final_b64_map = {}
for _final_i = 1, 64 do _final_b64_map[_final_b64_chars:sub(_final_i, _final_i)] = _final_i - 1 end

local function _final_b64_decode(s)
    s = string.gsub(s, '[^' .. _final_b64_chars .. '=]', '')
    local _final_result = {}
    local _final_bits = 0
    local _final_bit_count = 0
    
    for _final_i = 1, #s do
        local _final_c = s:sub(_final_i, _final_i)
        if _final_c == '=' then break end
        _final_bits = _final_bits * 64 + (_final_b64_map[_final_c] or 0)
        _final_bit_count = _final_bit_count + 6
        
        if _final_bit_count >= 8 then
            _final_bit_count = _final_bit_count - 8
            local _final_byte = math.floor(_final_bits / (2 ^ _final_bit_count)) % 256
            table.insert(_final_result, string.char(_final_byte))
        end
    end
    return table.concat(_final_result)
end

local _final_enc_data = [[${finalEncryptedB64}]]
local _final_enc_key = [[${finalKeyB64}]]

local _final_data = _final_b64_decode(_final_enc_data)
local _final_key = _final_b64_decode(_final_enc_key)

local _final_decrypted = ''
for _final_i = 1, #_final_data do
    local _final_data_byte = _final_data:byte(_final_i)
    local _final_key_byte = _final_key:byte((_final_i - 1) % #_final_key + 1)
    _final_decrypted = _final_decrypted .. string.char(bit32.bxor(_final_data_byte, _final_key_byte))
end

-- 执行解密后的代码
local _final_success, _final_error = pcall(function()
    loadstring(_final_decrypted)()
end)

if not _final_success then
    warn('最终执行错误:', _final_error)
end
`;

    document.getElementById("output").value = finalOutput;
    console.log("混淆完成，输出已生成");
};