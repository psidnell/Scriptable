// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: stream; share-sheet-inputs: plain-text;
function processLine(line) {
    //console.log('line: ' + line);
}
    
function extractProject(line) {
    let pattern = /.*<<(.*)>>.*/;
    let match = pattern.exec(line);
    return match.length >= 2 ? match[1] : null;
}

function extractVariables(text) {
    let textOnOneLine = text.split('\n').join('');
    let varMap = {};
    let pattern = /\$\{([^}]*)\}/g;
    let match = pattern.exec(textOnOneLine);
    while (match) {
        let variable = match[1];
        varMap[variable] = variable;
        match = pattern.exec(textOnOneLine);
    }
    let variables = Object.keys(varMap);
    variables.sort();
    return variables;
}

function getVariableValues(variableNames) {
}

function expand(text) {
    let variableNames = extractVariables(text);
    console.log('variable names: ' + variableNames);
    let variables = getVariableValues(variableNames);
    let lines = text.split('\n');
    if (lines.length >= 2) {
        let project = extractProject(lines[0]);
        console.log('project: ' + project);
        if (project) {
            let firstLine = lines[0].split('<<')[0] + lines[0].split('>>')[1];
            processLine(firstLine);
            for(let i = 1; i < lines.length; i++) {
                processLine(lines[i]);
            }
        }
    }
}

//expand(args.plainTexts[0]);
expand(
'- Test Template<<Home>> @parallel(true) @autodone(true) @context(/dev/null) @tags(/dev/null)\n' + 
'	- This is a thing that tests expansion. It uses ${VAR} and all built in variables @parallel(true) @autodone(false) @context(🏠 : AT HOME 🏠) @tags(🏠 : AT HOME 🏠)\n' +
'		${VAR}\n' + 
'		\n' +
'		${DATE}\n' +
'		\n' +
'		${TIME}\n' +
'		\n' +
'		${DAY}\n' +
'		\n' +
'		${HERE}\n');

