// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: blue;
// icon-glyph: location-arrow; share-sheet-inputs: url;

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

const ROW_HEIGHT = 50;

function decodeUrlParams(url) {
    let lines = url.split(/[\?\&]/);
    let dict = {};
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let attribValue = line.split('=');
        if (attribValue.length == 2) {
            dict[attribValue[0]] = decodeURI(attribValue[1]);
        }
    }
    return dict;
}

function processAppleUrl(appleMapsUrl, dict) {
    let address = '';

    if (dict['address']) {
        let lines = dict['address'].split(',');
        for (let i = 0; i < lines.length; i++) {
            lines[i] = lines[i].trim();
        }
        address = lines.join('\n');
    }
    
    let latLong = dict['ll'];

    return {
        ll: latLong,
        address: address,
        appleMapsUrl: appleMapsUrl,
        googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=' + latLong,
        wazeUrl: 'https://waze.com/ul?ll=' + latLong
    };
}

function addRow(uiTable, text, isHeader) {
    let lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let uiTableRow = new UITableRow();
        let cell = uiTableRow.addText(isHeader ? line.toUpperCase() : line);
        cell.leftAligned();
        cell.widthWeight = 100;
        uiTableRow.height = ROW_HEIGHT;
        uiTableRow.cellSpacing = 10;
        uiTableRow.dismissOnSelect = false;
        uiTableRow.isHeader = isHeader;
        uiTable.addRow(uiTableRow);
    }
}

function addButton(uiTable, text, fn) {
    let row = new UITableRow();
    let cell = row.addButton(text);
    cell.onTap = fn;
    cell.widthWeight = 100;
    
    row.height = ROW_HEIGHT;
    row.cellSpacing = 10;
    row.dismissOnSelect = false;
    row.isHeader = false;
    uiTable.addRow(row);
}

function display(info) {
    let uiTable = new UITable();
    
    let pasteData = [
        info.address,
        info.appleMapsUrl,
        info.googleMapsUrl,
        info.wazeUrl
    ];
    
    addRow(uiTable, "Location Details Extracted", true);
    
    addRow(uiTable, pasteData.join('\n'), false);
    
    addRow(uiTable, "Actions", true);
    
    addButton(uiTable, 'Open in Apple Maps', () => {
        Safari.open(info.appleMapsUrl);
    });
    
    addButton(uiTable, 'Open in Google Maps', () => {
        Safari.open(info.googleMapsUrl);
    });
    
    addButton(uiTable, 'Open in Waze', () => {
        Safari.open(info.wazeUrl);
    });
    
    addButton(uiTable, 'Share Formatted Location', () => {
        ShareSheet.presentAndWait([pasteData.join('\n\n')]);
    });
    
    addButton(uiTable, 'Copy Formatted Location', () => {
        Pasteboard.copyString(pasteData.join('\n\n'));
        let alert = new Alert();
        alert.title = 'Information in Paste Buffer';
        alert.addCancelAction('OK');
        alert.present(); 
    });
    
    QuickLook.present(uiTable);
}

if (args.urls && args.urls.length > 0) {
    url = args.urls[0];
    let dict = decodeUrlParams(url);
    
    if (url.startsWith('https://maps.apple.com/')) {
        info = processAppleUrl(url, dict);
        display(info);
    }
} else {
    let alert = new Alert();
    alert.title = 'Use Current Location?';
    alert.message = 'Will take several seconds';
    alert.addAction('Yes');
    alert.addCancelAction('Cancel');
    alert.presentAlert().then((opt) => {
        if (opt == 0) {
            console.log('Fetching location...');
            let location = Location.current();
            location.then((locData) => {
                let ll = locData.latitude + ',' + locData.longitude;
                let url = 'https://maps.apple.com/?ll=' + ll + '&t=m';
                let dict = decodeUrlParams(url);
                info = processAppleUrl(url, dict);
                display(info);
            });
        }
    });
    
}
