// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: magic-wand;
// TODO
// Constants at top for work/home calendars and projects
// Date at start of line?

const CALENDAR_TITLE_MAP = {
    'Calendar': 'Work'
};

const PROJECT_MAP = {
    'Calendar': 'Work : Calendar',
    'Home': 'Home: Calendar: Calendar'
};

// Whole bunch of date formatting
function getYear(d) {return d.getFullYear();}
function getMonth(d) {return ("0" + (d.getMonth()+1)).slice(-2);}
function getDate(d) {return ("0" + d.getDate()).slice(-2);}
function getHHMM(d) {return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);}
function formatDateTime(d) {return getYear(d) + '-' + getMonth(d) + '-' + getDate(d) + ' ' + getHHMM(d);}
function formatDate(d) {return getYear(d) + '-' + getMonth(d) + '-' + getDate(d);}
function getDayName(d) {var weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];return weekday[d.getDay()];}
function getMonthName(d) {var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];return months[d.getMonth()];}
function formatNiceDateTime(d) {return getDayName(d) + ' ' + getDate(d) + ' ' + getMonthName(d) + ' ' + getHHMM(d);}
function formatNiceDate(d) {return getDayName(d) + ' ' + getDate(d) + ' ' + getMonthName(d);}

// Tidy up a location extracted from the calendar
function tidyLocation(location) {
    return location.split('\n').join(', ');
}

function fixCalendarName(name) {
    let newName = CALENDAR_TITLE_MAP[name];
    return newName != null ? newName : name;
}

function deriveProjectFromCalendar(calendar) {
    let project = PROJECT_MAP[calendar];
    return project != null ? project : PROJECT_MAP['Home'];
}

// Create an Omnifocus entry
function createEntry(data) {
    let url = new CallbackURL('omnifocus:///add');
    url.addParameter('name', data.name);
    url.addParameter('project', data.project);
    url.addParameter('due', data.due);
    url.addParameter('defer', data.defer);
    url.addParameter('flag', 'true');
    url.addParameter('note', data.note);
    url.addParameter('reveal-new-item', 'false'); // Ignored?, always opened in edit mode in OF
    console.log('Openning ' + url.getURL())
    url.open();
}

// Process an event that has been selected for addition to OmniFocus   
function handleSelectedEvent(event) {
    let calendar = fixCalendarName(event.calendar.title);
    let title = event.title;
    let project = deriveProjectFromCalendar(event.calendar.title);
    let start = formatDate(event.startDate);
    let end = formatDate(event.endDate);
    let singleDay = start === end;
    let location = event.location
    let note = [calendar, location].join('\n');
    
    if ('Work' === calendar) {
        project = 'Work : Calendar';
    }
    
    if (event.isAllDay && !singleDay) {
        // Multi day event
        createEntry({
        		name: title + ' starts ' + formatNiceDate(event.startDate) + ' - ' + formatNiceDate(event.endDate),
        		project: project,
        		due: start,
        		defer: start,
        		note: note
    		});
        createEntry({
        		name: title + ' ends ' + formatNiceDate(event.endDate),
        		project: project,
        		due: end,
        		defer: end,
        		note: note
    		});
    } else if (event.isAllDay) {
        // All day event
        let due = formatDate(event.startDate);
        let defer = formatDate(event.startDate);
        createEntry({
        		name: title + ' ' + formatNiceDate(event.startDate),
        		project: project,
        		due: due,
        		defer: defer,
        		note: note
    		});
    } else {
        // Timed event
        let due = formatDateTime(event.startDate);
        let defer = formatDate(event.startDate);
        createEntry({
        		name: title + ' ' + formatNiceDateTime(event.startDate),
        		project: project,
        		due: due,
        		defer: defer,
        		note: note
    		});
    }
}

function addTitleRow(uiTable, text) {
    let uiTableRow = new UITableRow();
    let titleCell = uiTableRow.addText(text);
    titleCell.widthWeight = 100;
    uiTableRow.height = 40;
    uiTableRow.cellSpacing = 10;
    uiTableRow.dismissOnSelect = false;
    uiTableRow.isHeader = true;
    uiTable.addRow(uiTableRow);
    return uiTableRow;
}

function addRow(uiTable, text1, text2) {
    let uiTableRow = new UITableRow();
    
    let cell1 = uiTableRow.addText(text1);
    cell1.widthWeight = 15;
    cell1.leftAligned();
    
    let cell2 = uiTableRow.addText(text2);
    cell2.widthWeight = 85;
    cell2.leftAligned();
    
    uiTableRow.height = 40;
    uiTableRow.cellSpacing = 10;
    uiTableRow.dismissOnSelect = false;
    uiTable.addRow(uiTableRow);
    return uiTableRow;
}

function handleEvents(events) {
    let uiTable = new UITable();
    let i;
    let lastEventDate = null;
    for (i = 0; i < events.length; i++) {
        let event = events[i];
        let eventDate = formatNiceDate(event.startDate);
        
        // date
        if (eventDate !== lastEventDate) {
            addTitleRow(uiTable, eventDate);
        }
        
        // title
        addRow(uiTable, getHHMM(event.startDate), event.title).onSelect = (selIndex) => {
            handleSelectedEvent(event);
        }
        
        // calendar/
        addRow(uiTable, '', [fixCalendarName(event.calendar.title), tidyLocation(event.location)].join(' '));
        
        lastEventDate = eventDate;
    }
    QuickLook.present(uiTable);
}

function handleErr(val) {
    console.error(val);
}

function handleCalendars(calendars) {
    let now = new Date();
    let future = new Date();
    future.setDate(future.getDate() + 64);
    CalendarEvent.between(now, future, calendars).then(handleEvents, handleErr);
}

Calendar.forEvents().then(handleCalendars, handleErr);