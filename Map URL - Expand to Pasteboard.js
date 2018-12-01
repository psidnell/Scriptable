// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: location-arrow;
// share-sheet-inputs: url;

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

let appleMapsUrl = args.urls[0];
let dict = decodeUrlParams(appleMapsUrl);

let address = '';
if (dict['address']) {
    let lines = dict['address'].split(',');
    for (let i = 0; i < lines.length; i++) {
        lines[i] = lines[i].trim();
    }
    address = lines.join('\n');
}

let latLong = dict['ll'];
let googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + latLong;

let pasteData = [address, appleMapsUrl, googleMapsUrl].join('\n\n');

Pasteboard.copyString(pasteData);

console.log('Location data in paste buffer');