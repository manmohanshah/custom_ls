// import types
import { IDocListItem } from "./types";
// import native node modules
const fs = require("fs");
const path = require("path");
// import third-party node module
const Table = require('cli-table');

// config for output display as a table
let docListTable = new Table({
    chars: {
        'top': '',
        'top-mid': '',
        'top-left': '',
        'top-right': '',
        'bottom': '',
        'bottom-mid': '',
        'bottom-left': '',
        'bottom-right': '',
        'left': '',
        'left-mid': '',
        'mid': '',
        'mid-mid': '',
        'right': '',
        'right-mid': '',
        'middle': '  '
    },
    style: {
        'padding-left': 0,
        'padding-right': 0
    },
    colAligns: ["left", "right", "left"]
});

// strip first 2 arguments from the command line argument list to extract only usable values
const cliArgs: string[] = process.argv.slice(2);

// extract folder path from the command line argument list
let folderPath: string = "";
if (cliArgs.length === 1) {
    folderPath = path.normalize(cliArgs[0]);
} else {
    console.log("Incorrect number of arguments supplied. Usage: node custom_ls.js <path of folder>");
    process.exit(0);
}

const docList: IDocListItem[] = []; // list of folders and files at a given path
let totalFileSize: number = 0; // total size of all files at a given path, in bytes
let fileCount: number = 0; // count of all files at a given path
let folderCount: number = 0; // count of all subfolders at a given path
let docNames: string[];
try {
    docNames = fs.readdirSync(folderPath); // get names of folders and files at a given path
} catch (err) {
    // log error and exit, if given path is invalid
    console.log(err.message);
    process.exit(0);
}

// build an array of file objects containing all required info
for (const docName of docNames) {
    const fullDocName: string = path.join(folderPath, docName);
    let stats; // information about file
    try {
        stats = fs.statSync(fullDocName); // get information about file
    } catch (err) {
        continue; // skip, if file cannot be accessed
    }
    const lastModifiedDate: Date = new Date(stats.mtime);
    const [month, day, year] = [lastModifiedDate.getMonth() + 1, lastModifiedDate.getDate(), lastModifiedDate.getFullYear()];
    const [hour, minutes] = [lastModifiedDate.getHours(), lastModifiedDate.getMinutes()];
    const lastModifiedDateStr: string = `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}/${year} ${hour.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    const docListItem: IDocListItem = {
        name: docName,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        lastModifiedOn: lastModifiedDateStr
    };
    docList.push(docListItem);

    // update count and size for files
    if (!stats.isDirectory()) {
        fileCount++;
        totalFileSize += stats.size;
    } else {
        folderCount++;
    }
}

// sort array of file objects, firstly based on type (FOLDER or FILE) and then on size of files
docList.sort(compareFn);

// build a table to display the file list on console in pretty format
for (const docListItem of docList) {
    const size: string = docListItem.isDirectory ? "<DIR>" : docListItem.size.toString();
    docListTable.push([docListItem.lastModifiedOn, size, docListItem.name]);
}

// display output to console
console.log(docListTable.toString());
console.log(`${fileCount} File(s) ${totalFileSize} bytes`);
console.log(`${folderCount} Dir(s)`);

// comparison function
function compareFn(item1: IDocListItem, item2: IDocListItem): number {
    if (item1.isDirectory === true && item2.isDirectory === false) {
        return -1;
    } else if (item1.isDirectory === false && item2.isDirectory === true) {
        return 1;
    } else {
        return item1.size - item2.size;
    }
}
