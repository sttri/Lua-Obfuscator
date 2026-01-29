import { renameVars } from './renamer.js'
import { encodeStrings } from './strings.js'
import { injectGarbageFlood } from './garbage.js'
import { flattenControlFlow } from './flatten.js'
import { vmProtect } from './vm.js'

window.runObfuscation = function () {
    let code = document.getElementById("input").value

    code = encodeStrings(code)
    code = renameVars(code)
    code = injectGarbageFlood(code)
    code = flattenControlFlow(code)
    code = vmProtect(code)

    document.getElementById("output").value = code
}

window.copyOut = function(){
    const out = document.getElementById("output")
    out.select()
    document.execCommand("copy")
}