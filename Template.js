// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: stream; share-sheet-inputs: plain-text;

/*
TODO
- handle pre-defined variables like workflow:
  DATE
  TIME
  DAY
  HERE
- tidy, comments and license
*/
function processLine(line, variables) {
    let variableNames = Object.keys(variables);
    for (let i = 0; i < variableNames.length; i++) {
        let variableName = variableNames[i];
        let variable = '${' + variableName + '}';
        line = line.replace(variable, variables[variableName]);
    }
    return line;
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
        alert.message = variableName;
        alert.addTextField('value')
        alert.addAction('OK');
        let promise = alert.presentAlert();
        await promise;
        let value = alert.textFieldValue(0);
        variables[variableName] = value;
    }
    return variables;
}

function handleErr(val) {
    console.error(val);
}

// Create an Omnifocus entry
function createEntry(project, taskpaper) {
    let url = new CallbackURL('omnifocus://x-callback-url/paste');
    url.addParameter('target', project);
    url.addParameter('content', taskpaper);

    // Confirmation alert
    let alert = new Alert();
    alert.title = 'Expand OmniFocus Template';
    alert.message = 'To ' + project;
    alert.addAction('OK');
    alert.addCancelAction('Cancel');
    alert.present().then((selId) => {
        if (selId === 0) {
            console.log(url.getURL())
            url.open();
        }
    }, handleErr);
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
                let buffer = '';
                let firstLine = lines[0].replace(/<<.*>>/, '');
                buffer += processLine(firstLine, variables) + '\n';
                for(let i = 1; i < lines.length; i++) {
                    buffer += processLine(lines[i], variables) + '\n';
                }
                
                console.log(buffer);
                createEntry(project, buffer)
            }
        }
    });
}

if (args && args.plainTexts.length > 0) {
    expand(args.plainTexts[0]);
} else {
    expand(
        '- Test Template<<projects>> @parallel(true) @autodone(true) @context(/dev/null) @tags(/dev/null)\n' + 
        '	- This is a thing that tests expansion. It uses ${VAR} and all built in variables @parallel(true) @autodone(false) @context(🏠 : AT HOME 🏠) @tags(🏠 : AT HOME 🏠)\n' +
        '		${VAR}\n' + 
        '		\n' +
        '		${DATE}\n' +
        '		\n' +
        '		${TIME}\n' +
        '		\n' +
        '		${DAY}\n' +
        '		\n' +
        '		${HERE}\n'
    );
}
