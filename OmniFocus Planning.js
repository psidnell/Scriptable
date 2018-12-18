// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: stream;
const MENU = [
    {name: 'Perspectives', title: true},
    {name: 'Available', perspective: 'Available'},
    {name: 'Calendar', perspective: 'Calendar'},
    {name: 'Due Soon', perspective: 'Due Soon'},
    {name: 'Forecast', builtIn: 'forecast'},
    {name: 'Inbox', builtIn: 'inbox'},
    {name: 'Morning', perspective: 'Morning'},
    {name: 'Morning H', perspective: 'Morning H'},
    {name: 'Refiling', perspective: 'Refiling'},
    {name: 'Review', perspective: 'Review'},
    {name: 'Review - Built In', builtIn: 'review'},
    {name: 'Someday', perspective: 'Someday'},
    {name: 'Today', perspective: 'Today'},
    {name: 'Up Next', perspective: 'Up Next'},
    {name: 'Waiting', perspective: 'Waiting'},
    
    {name: 'Templates', title: true},
    {name: 'Daily Planning', task: 'bYC23KS953g'},
    {name: 'Work Day', task: 'iTviqZb9m8B'},
    {name: 'Weekly Review', task: 'lEejXeknDyP'},
    {name: 'Monthly Review', task: 'fqWsysXqmXI'},
];

const table = new UITable();
for(let i = 0; i < MENU.length; i++) {
    let item = MENU[i];
    let row = new UITableRow();
    let cell = row.addText(item.name);
    row.isHeader = item.title == true;
    row.dismissOnSelect = false;
    row.onSelect = (number) => {
        if (item.url) {
            Safari.open(item.url);
        } else if (item.perspective) {
            Safari.open('omnifocus:///perspective/' + encodeURI(item.perspective));
        } else if (item.builtIn) {
            Safari.open('omnifocus:///' + encodeURI(item.builtIn));
        } else if (item.task) {
            Safari.open('omnifocus:///task/' + encodeURI(item.task));
        }
	 }
    table.addRow(row);
}
QuickLook.present(table);