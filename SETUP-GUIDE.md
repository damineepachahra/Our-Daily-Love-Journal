# Setup guide — 10 minutes, no coding needed

Your site is built. Two things left: **connect it to a Google Sheet**, then **put it online**.

---

## Part 1 — Connect the Google Sheet (daminipachahra21@gmail.com)

1. Sign in to **daminipachahra21@gmail.com**, go to [sheets.google.com](https://sheets.google.com), and create a **new blank spreadsheet**. Name it something like `Our Daily Love Journal`.
2. In the sheet, go to **Extensions → Apps Script**.
3. Delete anything in the editor and paste in the entire contents of **`google-apps-script.gs`** (included in this folder).
4. Click the **Save** icon (💾).
5. Click **Deploy → New deployment**.
6. Click the gear icon ⚙️ next to "Select type" and choose **Web app**.
7. Fill in:
   - **Description:** Love journal API
   - **Execute as:** Me (daminipachahra21@gmail.com)
   - **Who has access:** **Anyone**
8. Click **Deploy**. The first time, Google will ask you to **authorize** — click through with your Google account and allow the permissions (you'll see an "unsafe" warning because it's your own unpublished script; click **Advanced → Go to project (unsafe) → Allow**).
9. Copy the **Web app URL** it gives you — it looks like:
   `https://script.google.com/macros/s/AKfycb.../exec`

That URL is the only "password" the site needs — keep the sheet itself as the private record.

### Plug it into the site
Open **`config.js`** and replace this line:

```js
const SHEET_API_URL = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
```

with your real URL, e.g.:

```js
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```

Save the file. That's it — every entry he saves on the site now appears as a new row in your Google Sheet, with the date, his rating, his message, and a timestamp. If you ever redeploy the script (e.g. after editing it), choose **Deploy → Manage deployments → edit (✏️) → New version** so the same URL keeps working.

---

## Part 2 — Put it on GitHub

1. Go to [github.com](https://github.com) and sign in to your account.
2. Click **+ → New repository**. Name it, e.g., `our-love-journal`. Keep it **Public** (needed for the free hosting in step 4). Click **Create repository**.
3. On the new repo page, click **uploading an existing file**, then drag in all the files from this folder:
   - `index.html`
   - `style.css`
   - `script.js`
   - `config.js` (with your Sheet URL already pasted in)
   - `images/` folder (all 4 photos)
   Commit the upload.
4. Go to the repo's **Settings → Pages**. Under "Build and deployment", set **Source: Deploy from a branch**, **Branch: main**, folder `/ (root)`. Click **Save**.
5. GitHub will give you a live link after a minute or two, usually:
   `https://<your-username>.github.io/our-love-journal/`

Send him that link. Whenever he opens it and clicks a date, his rating and message are saved straight into your Google Sheet.

---

## Notes

- The site only lets him fill in **today or past days** by default (so he can't pre-fill the future). Set `ONLY_ALLOW_PAST_AND_TODAY = false` in `config.js` if you'd rather he could write ahead.
- If he saves an entry while offline, it's kept on his device and the calendar still shows it — it just won't be in the Sheet until `config.js` is connected/online.
- Saving the same date twice **updates** that day's row instead of creating duplicates.
- Want to swap or add photos later? Just replace files inside `images/` (keep the same filenames, or update the `src=` paths in `index.html`).
