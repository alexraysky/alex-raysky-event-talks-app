# BigQuery Release Explorer & X (Twitter) Share Tool

A responsive web application built with **Python Flask** and **Vanilla HTML, JavaScript, and CSS** that fetches, formats, searches, filters, and shares Google Cloud BigQuery release notes.

## Features
- **Live Feed Fetcher**: Connects directly to Google's official BigQuery Release Notes feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`) to grab the latest announcements.
- **Robust Parsing & Categorization**: Custom Atom parser splits daily entries into individual release items and tags them as `Feature`, `Issue`, `Deprecation`, or `Update` based on feed markers.
- **Smart Memory Caching**: Caches feed responses locally in-memory for 1 hour to speed up load times, with a force-refresh trigger that queries live network data.
- **Category Filters & Text Search**: Easily filter by category tags or search by date/keywords.
- **Premium Glassmorphic UI**: Styled with modern typography (Outfit and Inter from Google Fonts), high-contrast category colors, translucent containers, smooth layout grids, hover animations, and placeholder loading skeletons.
- **Custom X/Twitter Composer**:
  - Selecting any card opens a sliding side-drawer composer.
  - Automatically drafts a tweet highlighting the release date, type, and truncated description, pre-formatted to fit comfortably within the **280-character limit**.
  - Provides a single-click button to Copy Text and another to post directly on X via Web Intents.

## Project Structure
```text
bq-releases-notes/
├── app.py               # Flask server & feed parsing engine
├── templates/
│   └── index.html       # HTML layout & drawer markup
└── static/
    ├── css/
    │   └── styles.css   # Theme styling & responsive grid layouts
    └── js/
        └── main.js      # Fetch requests, selection mechanics, & tweet generator
```

## Setup Instructions

### 1. Install Dependencies
Make sure you have Python installed. Install the Flask dependency:
```bash
pip install flask
```

### 2. Run the Application
From this directory, start the server:
```bash
python app.py
```

### 3. Open in Browser
Visit the app at:
[http://127.0.0.1:5000](http://127.0.0.1:5000)

## How to Share on X/Twitter
1. Click **Tweet** directly on any card to draft and open the Twitter Web Intent in a new tab immediately.
2. Or, click anywhere on the card to open the **Slide-in Composer Panel** on the right side.
3. Edit the preloaded tweet in the text composer.
4. Click **Post to X** to tweet it, or **Copy Text** to copy it directly to your clipboard.
