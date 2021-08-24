// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: purple;
// icon-glyph: calendar-alt;

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

// V1.0.5
// https://github.com/psidnell/Scriptable

// Number of days to show in the picker
DAYS_TO_SHOW = 150;

// The default project path for creating OmniFocus events
DEFAULT_PROJECT = ['[Calendar]'].join(' : ');

// Here you can create mappings so that different calendars create Omnifocus events in different projects.
const PROJECT_MAP = {
    'Calendar': ['[Calendar]'].join(' : '),
    'Work': ['[Calendar]'].join(' : ')
};

// The default tag path for creating OmniFocus events, can be null
DEFAULT_TAG = null; //['⭐ TODAY'].join(' : ');

// Here you can create mappings so that different calendars create Omnifocus events with different tags.
// Can be empty
const TAG_MAP = {
    //'Calendar': ['⭐ TODAY'].join(' : '),
    //'Work': ['⭐ TODAY'].join(' : ')
};

// Some calendars have annoying names, for example my Work exchange calendar is called "Calendar".
// Here you can add translations from the real name to an alternate one that will be used in the UI.
// This translates the calendar titled "Calendar" to "Work".
const CALENDAR_TITLE_MAP = {
    'Calendar': 'Work'
};

// There are some calendars we just want to ignore, I have a duplicate holidays calendar in exchange.
const CALENDARS_TO_IGNORE = new Set([
    'United Kingdom holidays'
]); 

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
function formatOFDateStartOfDay(d) {return getYear(d) + '-' + getMonth(d) + '-' + getDate(d);}
function formatOFDateEndOfDay(d) {return getYear(d) + '-' + getMonth(d) + '-' + getDate(d) + ' 23:59';}

// Tidy up a location extracted from the calendar
function locationToSingleLine(locationString) {
    // Put the location on a single line
    return locationString ? locationString.split('\n').join(', ') : '';
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

// Look up the tag to be used for the calendar name
function getTagFromCalendar(realCalendarName) {
    let tag = TAG_MAP[realCalendarName];
    return tag != null ? tag : DEFAULT_TAG;
}

// Extract the attendee names from the event
function extractAttendees(attendeeObjects) {
    let attendees = [];
    let i;
    for (i = 0; i < attendeeObjects.length; i++) {
        let attendee = attendeeObjects[i];
        attendees.push(attendee.name);
    }
    return attendees;
}

function handleErr(val) {
    console.error(val);
}

// Create an Omnifocus entry
async function createEntry(data) {
    let url = new CallbackURL('omnifocus:///add');
    url.addParameter('name', data.name);
    url.addParameter('project', data.project);
    if (data.tag) {
    	url.addParameter('tags', data.tag);
  	}
    url.addParameter('due', data.due);
    url.addParameter('defer', data.defer);
    url.addParameter('flag', 'false');
    url.addParameter('note', data.note);
    url.addParameter('reveal-new-item', 'false');
    url.addParameter('autosave', 'true');

    // Confirmation alert
    let alert = new Alert();
    alert.title = 'Create OmniFocus Task';
    alert.message = 'Task: "' + data.name + '"\nProject: "' + data.project + '"';
    alert.addAction('OK');
    alert.addCancelAction('Cancel');
    let selId = await (alert.present());
    if (selId === 0) {
        url.open();
    }
}

// True if the event is a multi-day all day event
function isAllDayAndMultiDay(event) {
    let start = formatOFDateStartOfDay(event.startDate);
    let end = formatOFDateStartOfDay(event.endDate);
    let singleDay = start === end;
    return event.isAllDay && !singleDay;
}

// True if the event is a multi-day single day event
function isAllDayAndSingleDay(event) {
    let start = formatOFDateStartOfDay(event.startDate);
    let end = formatOFDateStartOfDay(event.endDate);
    let singleDay = start === end;
    return event.isAllDay && singleDay;
}

// Process an event that has been selected for addition to OmniFocus
async function handleSelectedEvent(event) {
    let altCalendarName = getAlternateCalendarName(event.calendar.title);
    let title = event.title;
    let projectForCalendar = getProjectFromCalendar(event.calendar.title);
    let tagForCalendar = getTagFromCalendar(event.calendar.title);
    let location = event.location ? event.location : '';
    let attendees = event.attendees ? event.attendees : [];

    let startMorning = formatOFDateStartOfDay(event.startDate);
    let startExactTime = formatOFDateTime(event.startDate);
    let startMidnight = formatOFDateEndOfDay(event.startDate);

    let endMorning = formatOFDateStartOfDay(event.endDate);
    let endMidnight = formatOFDateEndOfDay(event.endDate);

    // Create note
    let note = 'Calendar: ' + altCalendarName + '\n\n';
    if (location !==  '') {
        note += 'Location:\n' + location.trim() + '\n\n';
    }
    if (attendees.length > 0) {
        note += 'Attendees:\n' + extractAttendees(attendees).join('\n') + '\n\n';
    }
    if (event.notes && event.notes.length > 0) {
        note += 'Notes:\n' + event.notes;
    }

    // Create the event(s) in OmniFocus
    if (isAllDayAndMultiDay(event)) {
        // Multi day event - start day
        await createEntry({
            name: title + ' starts ' + formatNiceDate(event.startDate) + ' - ' + formatNiceDate(event.endDate),
            project: projectForCalendar,
            tag: tagForCalendar,
            defer: startMorning,
            due: startMidnight,
            note: note
        });
        // Multi day event - end day
        await createEntry({
            name: title + ' ends ' + formatNiceDate(event.endDate),
            project: projectForCalendar,
            tag: tagForCalendar,
            defer: endMorning,
            due: endMidnight,
            note: note
        });
    } else if (isAllDayAndSingleDay(event)) {
        // All day event for a single day
        await createEntry({
            name: title + ' ' + formatNiceDate(event.startDate),
            project: projectForCalendar,
            tag: tagForCalendar,
            defer: startMorning,
            due: endMidnight,
            note: note
        });
    } else {
        // Simple event with time - possibly multi-day, but just set due to start
        let due = formatOFDateTime(event.startDate);
        await createEntry({
            name: title + ' ' + formatNiceDateTime(event.startDate),
            project: projectForCalendar,
            tag: tagForCalendar,
            defer: startMorning,
            due: startExactTime,
            note: note
        });
    }
}

// Create a title row (bold text)
function addTitleRow(uiTable, text) {
    let uiTableRow = new UITableRow();
    let titleCell = uiTableRow.addText(text.toUpperCase());
    titleCell.leftAligned();
    titleCell.widthWeight = 100;
    uiTableRow.height = 70;
    uiTableRow.cellSpacing = 10;
    uiTableRow.dismissOnSelect = false;
    uiTableRow.isHeader = true;
    uiTable.addRow(uiTableRow);
    return uiTableRow;
}

function getBlockImage(width, height, colour) {
    let c = new DrawContext()
    c.size = new Size(width, height)
    c.setFillColor(colour)
    c.fill(new Rect(0, 0 , width, height));
    return c.getImage();
}

function getOutlineBlockImage(width, height, colour) {
    let c = new DrawContext()
    c.size = new Size(width, height)
    c.setFillColor(colour)
    c.fill(new Rect(0, 0 , width, height/4 - 3));
    c.fill(new Rect(0, height/4 , width, height/4 - 3));
    c.fill(new Rect(0, 2 * height/4 , width, height/4 - 3));
    c.fill(new Rect(0, 3 * height/4 , width, height/4 - 3));
    return c.getImage();
}

// Create a row for an event
function addRow(table, dateText, eventText, subText, colour, allDay) {
    const rowHeight = 70;
    let row = new UITableRow();

    // The split seems OK on the narrowest ipad split view
    let cell1 = row.addImage(
        allDay ? getOutlineBlockImage(16, rowHeight, colour) : getBlockImage(16, rowHeight, colour));
    cell1.widthWeight = 5;
    cell1.leftAligned();
    
    let cell2 = row.addText(dateText);
    cell2.widthWeight = 20;
    cell2.leftAligned();

    let cell3 = row.addText(eventText, subText);
    cell3.widthWeight = 75;
    cell3.leftAligned();

    row.height = rowHeight;
    row.cellSpacing = 10;
    row.dismissOnSelect = false;
    row.isHeader = false;
    table.addRow(row);
    return row;
}

function getToday() {
    let today = new Date();
    today.setUTCHours(0)
    today.setUTCMinutes(0);
    today.setUTCSeconds(0);
    today.setUTCMilliseconds(0);
    return today;
}

function handleCalendarEvents(events) {
    let uiTable = new UITable();
    let lastEventDate = null;
    for (let i = 0; i < events.length; i++) {
        let event = events[i];
        let today = getToday();
        let eventDate = formatNiceDate(event.startDate);
        let colour = event.calendar.color;
        let allDay = false;
            
        // Date Header
        if (eventDate !== lastEventDate) {
            addTitleRow(uiTable, eventDate);
        }

        // Time and Title
        let subText = ['(' + getAlternateCalendarName(event.calendar.title) + ')', locationToSingleLine(event.location)].join(' ').trim();
        let time;
        if (isAllDayAndMultiDay(event)) {
            allDay = true;
            time = "Starts";
        } else if (isAllDayAndSingleDay(event)) {
            allDay = true;
            time = "All Day";
        } else {
            allDay = false;
            time = getHHMM(event.startDate);
        }

        addRow(uiTable, time, event.title, subText, colour, allDay).onSelect = (selIndex) => {
            handleSelectedEvent(event);
        };

        lastEventDate = eventDate;
    }
    QuickLook.present(uiTable);
}

function handleCalendars(calendars) {
    let today = getToday();
    let future = new Date();
    future.setDate(future.getDate() + DAYS_TO_SHOW);
    let filteredCalendars = calendars.filter(calendar => !CALENDARS_TO_IGNORE.has(calendar.title));
    CalendarEvent.between(today, future, filteredCalendars).then(handleCalendarEvents, handleErr);
}

Calendar.forEvents().then(handleCalendars, handleErr);
