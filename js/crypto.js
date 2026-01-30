function xorEncrypt(text,key){
    let out="";
    for(let i=0;i<text.length;i++){
        out+=String.fromCharCode(text.charCodeAt(i)^key.charCodeAt(i%key.length));
    }
    return out;
}

function randomKey(len=16){
    const c="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let r="";
    for(let i=0;i<len;i++) r+=c[Math.floor(Math.random()*c.length)];
    return r;
}