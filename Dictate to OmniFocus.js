// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: magic;
// If the first word (lower case) matches the key, then put the item in the named project
// otherwise it's added to the inbox

const PROJECT_MAPPING = {
    'shopping' : 'Shopping',
    'buy' : 'Shopping'
    'work' : 'Work : Misc',
    'home' : 'Home : Misc'
};
    
async function listen() {
    let dictation = await Dictation.start();
    
    if (dictation.length > 0) {
        let words = dictation.split(' ');
        let firstWord = words[0].toLowerCase();
        
        // See of the first word is a project
        let project = PROJECT_MAPPING[firstWord];
        
        // If it is then remove it from the text but add to that project
        if (project) {
            dictation = words.slice(1).join(' ');
        }
        
        let alert = new Alert ();
        alert.title = 'Add to Omnifocus' + (project ? ' (' + project + ')' : '');
        alert.message = dictation;
        alert.addAction('OK');
        alert.addAction('Ignore');
        alert.addCancelAction('Quit');
        let result = await alert.present();
        
        if (result === -1) {
            return false;
        } else if (result === 1) {
            return true;
        }
        
        // Send it to Omnifocus
        let baseUrl = 'omnifocus:///add';
        let url = new CallbackURL(baseUrl);
        url.addParameter('name', dictation);
        url.addParameter('flag', 'true');
        url.addParameter('reveal-new-item', 'false');
        url.addParameter('autosave', 'true');
        if (project) {
            url.addParameter('project', project);
        }
        await url.open();
        return true;
    } else {
        let alert = new Alert();
        alert.title = 'Nothing to Add';
        alert.addAction('Continue');
        alert.addCancelAction('Quit');
        let result = await alert.present();
        return result === 0;
    }
}

// Keep running until the user quits
async function go() {
    while (await listen()) {}
}

go();