// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: stream; share-sheet-inputs: plain-text;

/*
TODO
- populate lines with variables
- collect lines
- send lines to Omnifocus
- handle pre-defined variables
- final alert on entry
*/
function processLine(line, variables) {
    console.log('line: ' + line);
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

async function getVariableValues(variableNames) {
    let variables = {};
    for (let i = 0; i < variableNames.length; i++) {
        let variableName = variableNames[i];
        let alert = new Alert();
        alert.message = 'Value for "' + variableName + '"';
        alert.addTextField('value')
        alert.addAction('OK');
        let promise = alert.presentAlert();
        await promise;
        let value = alert.textFieldValue(0);
        variables[variableName] = value;
    }
    return variables;
}

function expand(text) {
    let variableNames = extractVariables(text);
    console.log('variable names: ' + variableNames);
    getVariableValues(variableNames).then((variables) => {
        console.log(variables);
        let lines = text.split('\n');
        if (lines.length >= 2) {
            let project = extractProject(lines[0]);
            console.log('project: ' + project);
            if (project) {
                let firstLine = lines[0].replace(/<<.*>>/, '');
                processLine(firstLine, variables);
                for(let i = 1; i < lines.length; i++) {
                    processLine(lines[i], variables);
                }
            }
        }
    });
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

