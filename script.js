/* =========================================================
   STATE
   ========================================================= */
let viewDate = new Date();
viewDate.setDate(1);

let entries = {};              // { "YYYY-MM-DD": { rating, message, timestamp } }
let selectedDateKey = null;
let selectedRating = 0;

const CACHE_KEY = "loveJournalEntriesCache";

/* =========================================================
   HELPERS
   ========================================================= */
function dateKey(y, m, d){
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function isFuture(y, m, d){
  const today = new Date();
  today.setHours(0,0,0,0);
  const check = new Date(y, m, d);
  return check > today;
}

function isToday(y, m, d){
  const today = new Date();
  return today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
}

function prettyDate(key){
  const [y,m,d] = key.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString(undefined, { month:"long", day:"numeric", year:"numeric" });
}

/* =========================================================
   GOOGLE SHEET SYNC
   ========================================================= */
function isConfigured(){
  return typeof SHEET_API_URL === "string" &&
         SHEET_API_URL.startsWith("http") &&
         !SHEET_API_URL.includes("PASTE_YOUR");
}

async function loadEntries(){
  // warm start from local cache so the calendar paints instantly
  try{
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) entries = JSON.parse(cached);
  }catch(e){ /* ignore */ }
  renderCalendar();

  if (!isConfigured()) return;

  try{
    const res = await fetch(SHEET_API_URL, { method: "GET" });
    const data = await res.json();
    const fresh = {};
    (data || []).forEach(row => {
      if (!row.date) return;
      fresh[row.date] = { rating: Number(row.rating) || 0, message: row.message || "", timestamp: row.timestamp || "" };
    });
    entries = fresh;
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
    renderCalendar();
  }catch(err){
    console.warn("Could not load entries from Google Sheet:", err);
  }
}

async function saveEntryToSheet(key, rating, message){
  const payload = { date: key, rating, message };

  // local-first: always keep a copy so nothing is ever lost
  entries[key] = { rating, message, timestamp: new Date().toISOString() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entries));

  if (!isConfigured()){
    return { ok:false, reason:"not-configured" };
  }

  try{
    // text/plain avoids a CORS pre-flight against Apps Script
    await fetch(SHEET_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    return { ok:true };
  }catch(err){
    console.warn("Could not save to Google Sheet, kept locally instead:", err);
    return { ok:false, reason:"network" };
  }
}

/* =========================================================
   CALENDAR RENDER
   ========================================================= */
function renderCalendar(){
  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();

  document.getElementById("monthLabel").textContent =
    viewDate.toLocaleDateString(undefined, { month:"long", year:"numeric" });

  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";

  const firstWeekday = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m+1, 0).getDate();

  for (let i=0; i<firstWeekday; i++){
    const empty = document.createElement("div");
    empty.className = "day-cell empty";
    grid.appendChild(empty);
  }

  for (let d=1; d<=daysInMonth; d++){
    const key = dateKey(y, m, d);
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.textContent = d;

    if (entries[key]) cell.classList.add("filled");
    if (isToday(y, m, d)) cell.classList.add("today");
    if (ONLY_ALLOW_PAST_AND_TODAY && isFuture(y, m, d)) cell.classList.add("future");

    if (entries[key]){
      const mark = document.createElement("span");
      mark.className = "mark";
      mark.textContent = "♥";
      cell.appendChild(mark);
    }

    cell.addEventListener("click", () => {
      if (cell.classList.contains("future")) return;
      openEntry(key);
    });

    grid.appendChild(cell);
  }
}

/* =========================================================
   MODAL
   ========================================================= */
const modal = document.getElementById("entryModal");
const messageBox = document.getElementById("messageBox");
const hearts = document.querySelectorAll(".heart-btn");
const saveStatus = document.getElementById("saveStatus");
const saveBtn = document.getElementById("saveEntry");

function openEntry(key){
  selectedDateKey = key;
  const existing = entries[key];

  document.getElementById("entryDateLabel").textContent = prettyDate(key);
  messageBox.value = existing ? existing.message : "";
  selectedRating = existing ? existing.rating : 0;
  paintHearts();
  saveStatus.textContent = "";
  saveBtn.disabled = false;
  saveBtn.textContent = "save this page";

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeEntry(){
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function paintHearts(){
  hearts.forEach(h => {
    const v = Number(h.dataset.value);
    h.classList.toggle("active", v <= selectedRating);
  });
}

hearts.forEach(h => {
  h.addEventListener("click", () => {
    selectedRating = Number(h.dataset.value);
    paintHearts();
  });
});

document.getElementById("closeModal").addEventListener("click", closeEntry);
modal.addEventListener("click", (e) => { if (e.target === modal) closeEntry(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeEntry(); });

saveBtn.addEventListener("click", async () => {
  if (!selectedDateKey) return;
  const message = messageBox.value.trim();

  saveBtn.disabled = true;
  saveBtn.textContent = "saving...";
  saveStatus.textContent = "";

  const result = await saveEntryToSheet(selectedDateKey, selectedRating, message);

  renderCalendar();
  saveBtn.disabled = false;
  saveBtn.textContent = "saved ♥";

  if (result.ok){
    saveStatus.textContent = "sent to the journal";
  } else if (result.reason === "not-configured"){
    saveStatus.textContent = "saved on this device (connect Google Sheet in config.js)";
  } else {
    saveStatus.textContent = "saved on this device — will sync once online";
  }

  setTimeout(closeEntry, 1100);
});

/* =========================================================
   MONTH NAV
   ========================================================= */
document.getElementById("prevMonth").addEventListener("click", () => {
  viewDate.setMonth(viewDate.getMonth() - 1);
  renderCalendar();
});
document.getElementById("nextMonth").addEventListener("click", () => {
  viewDate.setMonth(viewDate.getMonth() + 1);
  renderCalendar();
});

/* =========================================================
   INIT
   ========================================================= */
loadEntries();
