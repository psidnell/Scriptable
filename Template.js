// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: purple;
// icon-glyph: puzzle-piece; share-sheet-inputs: plain-text;
/*
 * Copyright 2018 Paul Sidnell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// V1.0.0
// https://github.com/psidnell/Scriptable

/*
TODO
- HERE not looking up address (possible?), creating maps URL for now
*/

// Whole bunch of little date formatting functions
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function getYear(d) { return d.getFullYear(); }
function getMonth(d) { return ("0" + (d.getMonth()+1)).slice(-2); }
function getDate(d) { return ("0" + d.getDate()).slice(-2); }
function getHHMM(d) { return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
function getDayName(d) { return WEEKDAYS[d.getDay()]; }
function getMonthName(d) { return MONTHS[d.getMonth()]; }

// Date formatting for display
function formatNiceDateTime(d) { return getDayName(d) + ' ' + getDate(d) + ' ' + getMonthName(d) + ' ' + getHHMM(d); }
function formatNiceDate(d) { return getDate(d) + ' ' + getMonthName(d) + ' ' + getYear(d); }

// Date formatting for OmniFocus parsing
function formatOFDateTime(d) {return getYear(d) + '-' + getMonth(d) + '-' + getDate(d) + ' ' + getHHMM(d);}
function formatOFDate(d) {return getYear(d) + '-' + getMonth(d) + '-' + getDate(d);}

// Expand all the variables on a single line
function processLine(line, variables) {
    let variableNames = Object.keys(variables);
    for (let i = 0; i < variableNames.length; i++) {
        let variableName = variableNames[i];
        let variable = '${' + variableName + '}';
        let value = variables[variableName];
        line = line.replace(variable, value);
    }
    return line;
}

// Extract the target from a line "... <<target>> ..."
function extractTarget(line) {
    let pattern = /.*<<(.*)>>.*/;
    let match = pattern.exec(line);
    return match.length >= 2 ? match[1] : null;
}

// Extract a list of the unique ${...} variables from the template
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

// Create a map of the variables and their values using predfined
// rules or asking for values
async function getVariableValues(variableNames) {
    let variables = {};
    for (let i = 0; i < variableNames.length; i++) {
        let variableName = variableNames[i];
        
        if ('DATE' === variableName) {
            let value = formatNiceDate(new Date());
            variables[variableName] = value;
        } else if ('TIME' === variableName) {
            let value = getHHMM(new Date());
            variables[variableName] = value;
        } else if ('DAY' === variableName) {
            let value = getDayName(new Date());
            variables[variableName] = value;
        } else if ('MONTH' === variableName) {
            let value = getMonthName(new Date());
            variables[variableName] = value;
        } else if ('YEAR' === variableName) {
            let value = getYear(new Date());
            variables[variableName] = value;
        } else if ('HERE' === variableName) {
            let promise = Location.current();
            console.log('Fetching location, please wait a few seconds...');
            let location = await promise;
            // returns {"verticalAccuracy":4,"longitude":xxxxx,"latitude":yyyyy,"horizontalAccuracy":10,"altitude":45.898406982421875}
            // TODO lookup address? https://talk.automators.fm/t/get-address-from-location-object/3332
            // Generate a maps URL for now
            let value = 'http://maps.apple.com/?daddr=' + location.latitude + ',' + location.longitude;
            variables[variableName] = value;
        } else {
            // Not a predifined variable, ask the user
            let alert = new Alert();
            alert.message = variableName;
            alert.addTextField('value')
            alert.addAction('OK');
            let promise = alert.presentAlert();
            await promise;
            let value = alert.textFieldValue(0);
            variables[variableName] = value;
        }
    }
    return variables;
}

function handleErr(val) {
    console.error(val);
}

// Create an Omnifocus entry
async function createEntry(target, taskpaper) {
    let ofUrl = null;
    let url = new CallbackURL('omnifocus://x-callback-url/paste');
    url.addParameter('target', target);
    url.addParameter('content', taskpaper);

    // Confirmation alert
    let alert = new Alert();
    alert.title = 'Expand OmniFocus Template';
    alert.message = 'To ' + target;
    alert.addAction('OK');
    alert.addCancelAction('Cancel');
    let alertPromise = alert.present();
    let selId = await alertPromise;
    if (selId === 0) {
      // console.log('Generated URL: ' + url.getURL())
      let ofPromise = url.open();
      let result = await ofPromise;
      if (result) {
          // Haven't timed out.
          // result is of the form {"result":"omnifocus:///task/h8s1lykVkjM"}
          ofUrl = result.result;
      }
    }
    // console.log('Response from OmniFocus: ' + ofUrl
    return ofUrl;
}

// Expand the template, open in OmniFocus
function expand(text) {
    let variableNames = extractVariables(text);
    // console.log('Variable names extracted: ' + variableNames);
    getVariableValues(variableNames).then((variables) => {
        // console.log('Variable values: ' variables);
        let lines = text.split('\n');
        if (lines.length >= 1) {
            let target = extractTarget(lines[0]);
            // console.log('Target: ' + target);
            if (target) {
                let buffer = '';
                let firstLine = lines[0].replace(/<<.*>>/, '');
                buffer += processLine(firstLine, variables) + '\n';
                for(let i = 1; i < lines.length; i++) {
                    buffer += processLine(lines[i], variables) + '\n';
                }
                
                // console.log('Expanded template: ' + buffer);
                let urlPromise = createEntry(target, buffer);
                urlPromise.then((taskUrl) => {
                    if (taskUrl) {
                        Safari.open(taskUrl);
                    }
                });
            }
        }
    });
}

// Open the shared template if provided or a test one if run directly from scriptable.
if (args && args.plainTexts.length > 0) {
    expand(args.plainTexts[0]);
} else {
    expand(
        '- Test Template<<projects>> @parallel(true) @autodone(true)\n' + 
        '	- This is a test of expansion. It uses all built in variables @parallel(true) @autodone(false)\n' +
        '		${VAR}\n' + 
        '		\n' +
        '		${DATE}\n' +
        '		\n' +
        '		${TIME}\n' +
        '		\n' +
        '		${DAY}\n' +
        '		\n' +
        '		${MONTH}\n' + 
        '		\n' +
        '		${YEAR}\n'
        // Slow:
        //'		\n' +
        //'		${HERE}\n'
    );
}
