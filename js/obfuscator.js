function renameLocals(code){
    return code.replace(/\blocal\s+([a-zA-Z_]\w*)/g,()=>{
        return "local _"+Math.random().toString(36).slice(2,10);
    });
}