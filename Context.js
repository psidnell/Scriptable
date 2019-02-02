// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: teal; icon-glyph: magic;
// Example match value: 'Home,Weekday,Fri,am,Morning,09'
// The first match is used
const RULES = [

//==================
{title: 'Woken Up',
match: 'Home,.*,.*,.*,Early,.*',
shortcuts: [
'Phone In Bed',
'Phone Normal',
'Overcast Play',
'Tea'
],
perspectives: [
'Review',
'Morning H'
]},

//==================
{title: 'Home Morning',
match: 'Home,Weekday,.*,.*,Morning,.*',
shortcuts: [
'Phone Normal',
'Overcast Play'
],
perspectives: [
'Morning H',
'Today H'
]},

//==================
{title: 'Home Evening',
match: 'Home,.*,.*,.*,Evening,.*',
shortcuts: [
'Phone Normal',
'Overcast Play'
],
perspectives: [
'Evening H',
'Evening']},

//==================
{title: 'Home Late',
match: 'Home,.*,.*,.*,(Late|Night),.*',
shortcuts: [
'Phone In Bed',
'Phone At Night',
'Overcast Play'
]},

//==================
{title: 'Home Weekend',
match: 'Home,Weekend,.*,.*,.*,.*',
shortcuts: [
'Phone Normal',
'Overcast Play'
],
perspectives: [
'Today H',
'Out',
'Out Today']},

//==================
{title: 'Out',
match: 'Out,.*,.*,.*,.*,.*',
shortcuts: [
'Parked',
'I Am Here',
'Phone Low Power'
],
perspectives: [
'Out',
'Out Today']},

//==================
{title: 'Driving',
match: 'Driving,.*,.*,.*,.*,.*',
shortcuts: [
'Parked',
'Go To Work',
'Go Home'
],
perspectives: [
'Out',
'Out Today']},

//==================
// Default rule
{title: 'Default',
match: '.*',
shortcuts: [
'Phone At Night',
'Phone In Bed',
'Phone Normal'
]}

];
    
const GEO_CONTEXTS = {
    'BS7' : 'Home'
};

const DEFAULT_GEO_CONTEXT = "Out";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAY_TYPE = ['Weekend', 'Weekday', 'Weekday', 'Weekday', 'Weekday', 'Weekday', 'Weekend'];

const HOUR_TYPE = {
    '00':'Late',
    '01':'Night',
    '02':'Night',
    '03':'Night',
    '04':'Night',
    '05':'Early',
    '06':'Early',
    '07':'Early',
    '08':'Early',
    '09':'Morning',
    '10':'Morning',
    '11':'Morning',
    '12':'Lunchtime',
    '13':'Afternoon',
    '14':'Afternoon',
    '15':'Afternoon',
    '16':'Afternoon',
    '17':'Afternoon',
    '18':'Evening',
    '19':'Evening',
    '20':'Evening',
    '21':'Evening',
    '22':'Late',
    '23':'Late'
};

async function getShortPostcode() {
    console.log('Getting Location...');
    let location = await Location.current();
    console.log('Getting Address...');
    let address = await Location.reverseGeocode(location.latitude, location.longitude);
    let postcode = address[0].postalCode;
    let shortPostcode = postcode.split(' ')[0];
    return shortPostcode;
}

function setContext(context) {
    let fm = FileManager.iCloud();
    let docs = fm.documentsDirectory();
    fm.writeString(docs + '.context.txt', context);
}

async function getContext(useGeo) {
    let fm = FileManager.iCloud();
    let docs = fm.documentsDirectory();
    let filePath = docs + '.context.txt';
    let place = null;
    
    if (useGeo || !fm.fileExists(filePath)) {
        let shortPostcode = await getShortPostcode();
        place = GEO_CONTEXTS[shortPostcode];
        if (!place) {
            place = DEFAULT_GEO_CONTEXT;
        }
        setContext(place);
    } else {
        place = fm.readString(filePath);
    } 
    
    return place;
}

function getTime() {
	 let date = new Date();
	 let day = DAYS[date.getDay()];
	 let dayType = DAY_TYPE[date.getDay()];
	 let hour = '' + date.getHours();
    hour = hour.length === 1 ? '0' + hour : hour;
    let hourType = HOUR_TYPE[hour];
	 let amPm = hour < 12 ? 'am' : 'pm';
    return dayType + ',' + day + ',' + amPm + ',' + hourType + ',' + hour;
}

function getRule(key) {
    let rule = null;

    for (let i = 0; i < RULES.length; i++) {
        let match = key.match(RULES[i].match);
        if (match) {
            rule = RULES[i];
            break;
        }
    }
    return rule;
}

async function getShortcutsKey(useGeo) {
    let context = await getContext(useGeo);
    let time = getTime();
    let key = context + ',' + time;
    return key;
}

function createLauncherRow(text, fn) {
    let row = new UITableRow();
    row.dismissOnSelect = false;
    let cell = row.addText(text);
    row.onSelect = fn;
    return row;
}

function getInput(argName) {
    let params = URLScheme.allParameters();
    let value = params[argName];
    if (value) {
        return decodeURIComponent(params[argName]);
    } else {
        return null;
    }
}

function createTitleRow(text, subText) {
    let titleRow = new UITableRow();
    titleRow.addText(text, subText);
    titleRow.isHeader = true;
    titleRow.dismissOnSelect = false;
    return titleRow;
}

async function ui(rule, key) {
    let table = new UITable();
    
    table.addRow(createTitleRow(rule.title, key));

    let shortcuts = rule.shortcuts;
    if (shortcuts && shortcuts.length > 0) {
        
        table.addRow(createTitleRow('Shortcuts'));
        
        for (let i = 0; i < shortcuts.length; i++) {
            let shortcut = shortcuts[i];
            let row = createLauncherRow(shortcut, (selIndex) => {
                let url = new CallbackURL('shortcuts://run-shortcut');
                url.addParameter('name', shortcut);
                url.open();
            });
            table.addRow(row);
        }
    }

    let perspectives = rule.perspectives;
    if (perspectives && perspectives.length > 0) {
        
        table.addRow(createTitleRow('Perspectives'));
        
        for (let i = 0; i < perspectives.length; i++) {
            let perspective = perspectives[i];
            let row = createLauncherRow(perspective, (selIndex) => {
                let url = 'omnifocus:///perspective/' + encodeURI(perspective);
                Safari.open(url);
            });
            table.addRow(row);
        }
    }
    
    table.present();
}

// Load url parameters
let useGeo = getInput('geo') === 'true';
let context = getInput('context');

let key = null;
if (context && context.length > 0 && !useGeo) {
    setContext(context);
    key = await getShortcutsKey();
} else {
    key = await getShortcutsKey(useGeo);
}

let rule = getRule(key);

ui(rule, key);