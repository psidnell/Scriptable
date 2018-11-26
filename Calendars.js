// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: magic-wand;

// =============================================================================================
// A Scriptable (https://scriptable.app/) script that opens a list of upcoming iOS calendar events
// and creates OmniFocus events for those selected. Multi-day events get two OmniFocus events
// created, one for the start day, one for the end day.
// =============================================================================================
// Refs:
// - Scriptable API Docs https://docs.scriptable.app/
// =============================================================================================
// TODO:
// - Can I adjust font size?
// - Add attachments from event object
// - Add link back to calendar - is this possible with either the default iOS mail app or Fantastical?

// Number of days to show in the picker
DAYS_TO_SHOW = 64;

// The default project for creating OmniFocus events
DEFAULT_PROJECT = ['Home', 'Calendar', 'Calendar'].join(' : ');

// Here you can create mappings so that different calendars create Omnifocus events in different projects
const PROJECT_MAP = {
    'Calendar': ['Work','Calendar'].join(' : ')
};

// Some calendars have annoying names, for example my Work exchange calendar is called "Calendar".
// Here you can add translations from the real name to an alternate one that will be used in the UI.
const CALENDAR_TITLE_MAP = {
    'Calendar': 'Work'
};

// Whole bunch of little date formatting functions
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function getYear(d) { return d.getFullYear(); }
function getMonth(d) { return ("0" + (d.getMonth()+1)).slice(-2); }
function getDate(d) { return ("0" + d.getDate()).slice(-2); }
function getHHMM(d) { return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
function getDayName(d) { return WEEKDAYS[d.getDay()]; }
function getMonthName(d) { return MONTHS[d.getMonth()]; }

// Date formatting for display
function formatNiceDateTime(d) { return getDayName(d) + ' ' + getDate(d) + ' ' + getMonthName(d) + ' ' + getHHMM(d); }
function formatNiceDate(d) { return getDayName(d) + ' ' + getDate(d) + ' ' + getMonthName(d); }

// Date formatting for OmniFocus parsing
function formatOFDateTime(d) {return getYear(d) + '-' + getMonth(d) + '-' + getDate(d) + ' ' + getHHMM(d);}
function formatOFDate(d) {return getYear(d) + '-' + getMonth(d) + '-' + getDate(d);}

// Tidy up a location extracted from the calendar
function locationToSingleLine(locationString) {
    // Put the location on a single line
    return locationString.split('\n').join(', ');
}

// Look up any alternate calendar name
function getAlternateCalendarName(realCalendarName) {
    let newName = CALENDAR_TITLE_MAP[realCalendarName];
    return newName != null ? newName : realCalendarName;
}

// Look up the project to be used for the calendar name
function getProjectFromCalendar(realCalendarName) {
    let project = PROJECT_MAP[realCalendarName];
    return project != null ? project : DEFAULT_PROJECT;
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
    url.open();
}

// True if the event is a multi-day all day event
function isAllDayAndMultiDay(event) {
    let start = formatOFDate(event.startDate);
    let end = formatOFDate(event.endDate);
    let singleDay = start === end;
    return event.isAllDay && !singleDay;
}

// True if the event is a multi-day all day event
function isAllDayAndSingleDay(event) {
    let start = formatOFDate(event.startDate);
    let end = formatOFDate(event.endDate);
    let singleDay = start === end;
    return event.isAllDay && singleDay;
}

// Process an event that has been selected for addition to OmniFocus
function handleSelectedEvent(event) {
    let altCalendarName = getAlternateCalendarName(event.calendar.title);
    let title = event.title;
    let projectForCalendar = getProjectFromCalendar(event.calendar.title);
    let start = formatOFDate(event.startDate);
    let end = formatOFDate(event.endDate);
    let location = event.location;
    let note = [
        'Calendar: ' + altCalendarName,
        'Location:',
        location
    ].join('\n');

    if (isAllDayAndMultiDay(event)) {
        // Multi day event - start day
        createEntry({
            name: title + ' starts ' + formatNiceDate(event.startDate) + ' - ' + formatNiceDate(event.endDate),
            project: projectForCalendar,
            due: start,
            defer: start,
            note: note
        });
        // Multi day event - end day
        createEntry({
            name: title + ' ends ' + formatNiceDate(event.endDate),
            project: projectForCalendar,
            due: end,
            defer: end,
            note: note
        });
    } else if (isAllDayAndSingleDay(event)) {
        // All day event for a single day
        let due = formatOFDate(event.startDate);
        let defer = formatOFDate(event.startDate);
        createEntry({
            name: title + ' ' + formatNiceDate(event.startDate),
            project: projectForCalendar,
            due: due,
            defer: defer,
            note: note
        });
    } else {
        // Simple event with time
        let due = formatOFDateTime(event.startDate);
        let defer = formatOFDate(event.startDate);
        createEntry({
            name: title + ' ' + formatNiceDateTime(event.startDate),
            project: projectForCalendar,
            due: due,
            defer: defer,
            note: note
        });
    }
}

// Create a title row (bold text)
function addTitleRow(uiTable, text) {
    let uiTableRow = new UITableRow();
    let titleCell = uiTableRow.addText(text);
    titleCell.leftAligned();
    titleCell.widthWeight = 100;
    uiTableRow.height = 50;
    uiTableRow.cellSpacing = 10;
    uiTableRow.dismissOnSelect = false;
    uiTableRow.isHeader = true;
    uiTable.addRow(uiTableRow);
    return uiTableRow;
}

// Create a row for an event
function addRow(uiTable, dateText, eventText, subText) {
    let uiTableRow = new UITableRow();

    // The split seems OK on the narrowest ipad split view
    let cell1 = uiTableRow.addText(dateText);
    cell1.widthWeight = 20;
    cell1.leftAligned();

    let cell2 = uiTableRow.addText(eventText, subText);
    cell2.widthWeight = 80;
    cell2.leftAligned();

    uiTableRow.height = 70;
    uiTableRow.cellSpacing = 10;
    uiTableRow.dismissOnSelect = false;
    uiTableRow.isHeader = false;
    uiTable.addRow(uiTableRow);
    return uiTableRow;
}

function handleCalendarEvents(events) {
    let uiTable = new UITable();
    let i;
    let lastEventDate = null;
    for (i = 0; i < events.length; i++) {
        let event = events[i];
        let eventDate = formatNiceDate(event.startDate);

        // Date Header
        if (eventDate !== lastEventDate) {
            addTitleRow(uiTable, eventDate);
        }

        // Time and Title
        let subText = [getAlternateCalendarName(event.calendar.title), locationToSingleLine(event.location)].join(' ');
        let time;
        if (isAllDayAndMultiDay(event)) {
            time = "Starts";
        } else if (isAllDayAndSingleDay(event)) {
            time = "All Day";
        } else {
            time = getHHMM(event.startDate);
        }

        addRow(uiTable, time, event.title, subText).onSelect = (selIndex) => {
            handleSelectedEvent(event);
        };

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
    future.setDate(future.getDate() + DAYS_TO_SHOW);
    CalendarEvent.between(now, future, calendars).then(handleCalendarEvents, handleErr);
}

Calendar.forEvents().then(handleCalendars, handleErr);
