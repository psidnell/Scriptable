// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
function getInput(argName) {
    let params = URLScheme.allParameters();
    return decodeURIComponent(params[argName]);
}

function callBack(argName, value) {
    let params = URLScheme.allParameters();
    let baseURL = params['x-success'];
    let url = baseURL + '?' + argName + '=' + encodeURIComponent(value);
    Safari.open(url);
}

let arg = getInput('arg');

let alert = new Alert();
alert.title = arg;
alert.addAction('Continue');
await alert.present();

callBack('result', 'OK');

