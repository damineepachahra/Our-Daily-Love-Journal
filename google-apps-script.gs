/**
 * OUR DAILY LOVE JOURNAL — Google Sheet backend
 * ------------------------------------------------
 * Paste this whole file into Extensions > Apps Script
 * on a Google Sheet owned by daminipachahra21@gmail.com.
 * See SETUP-GUIDE.md for the full click-by-click steps.
 */

const SHEET_NAME = "Entries";

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["date", "rating", "message", "timestamp"]);
  }
  return sheet;
}

// Called when the website loads the calendar (reads existing entries)
function doGet(e) {
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  const entries = [];

  for (let i = 1; i < rows.length; i++) {
    const [date, rating, message, timestamp] = rows[i];
    if (!date) continue;
    entries.push({
      date: Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), "yyyy-MM-dd"),
      rating: rating,
      message: message,
      timestamp: timestamp
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify(entries))
    .setMimeType(ContentService.MimeType.JSON);
}

// Called when he saves a day's entry
function doPost(e) {
  const sheet = getSheet_();
  const data = JSON.parse(e.postData.contents);

  const rows = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    const existing = Utilities.formatDate(new Date(rows[i][0]), Session.getScriptTimeZone(), "yyyy-MM-dd");
    if (existing === data.date) { rowIndex = i + 1; break; }
  }

  const now = new Date();
  if (rowIndex > -1) {
    // update the existing day instead of duplicating it
    sheet.getRange(rowIndex, 2, 1, 3).setValues([[data.rating, data.message, now]]);
  } else {
    sheet.appendRow([data.date, data.rating, data.message, now]);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}
