// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: magic;

const { Files } = importModule("Files");
const { HTMLTable } = importModule("HTML Table");


const data = Files.readJson("Stop Watcher", "watchlist2.user.json");

const htmlTable = new HTMLTable();
htmlTable.setTableData(data);

await htmlTable.present();
