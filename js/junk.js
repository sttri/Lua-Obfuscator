function generateJunk(){
    return `local function _${Math.random().toString(36).slice(2,8)}() local a=${Math.floor(Math.random()*9999)} return a*0 end`;
}

function generateMassiveJunkLines(count = 500) {
    let junk = '';
    const junkTemplates = [
        `if math.random()>1 then print("never runs") end`,
        `for i=1,0 do print("infinite loop?") end`,
        `while false do print("stuck") end`,
        `repeat print("once") until true==false`,
        `local x=function() return "useless" end x=nil`,
        `local tbl={} tbl[math.huge]="impossible"`,
        `local y=0/0 if y==y then print("NaN") end`,
        `goto never ::never::`,
        `local a=1 a=a+2 a=a-3 a=a*0`,
        `local b="string" b=b.."more" b=nil`,
    ];

    for (let i = 0; i < count; i++) {
        const template = junkTemplates[Math.floor(Math.random() * junkTemplates.length)];
        junk += `${template} `;
    }
    return junk;
}