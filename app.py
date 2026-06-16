import os
import re
import time
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Cache configuration
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
cache = {
    "data": None,
    "last_fetched": 0,
    "expiry": 3600  # 1 hour
}

def clean_html_for_summary(html_text):
    """Simple helper to strip HTML tags and get clean text for tweet/summary"""
    # Replace links with their text
    text = re.sub(r'<a[^>]*>(.*?)</a>', r'\1', html_text)
    # Strip all other HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_release_feed():
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    req = urllib.request.Request(FEED_URL, headers=headers)
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('atom:entry', ns)
    
    notes = []
    
    for entry in entries:
        date_str = entry.find('atom:title', ns).text
        updated_str = entry.find('atom:updated', ns).text
        content_html = entry.find('atom:content', ns).text
        
        # Pattern to split by <h3>Type</h3> ... next <h3> or end
        pattern = r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)'
        matches = re.findall(pattern, content_html, re.DOTALL | re.IGNORECASE)
        
        if not matches:
            summary = clean_html_for_summary(content_html)
            notes.append({
                'id': f"{date_str.replace(' ', '_').replace(',', '')}_0",
                'date': date_str,
                'updated': updated_str,
                'type': 'Update',
                'content': content_html.strip(),
                'summary': summary
            })
        else:
            for idx, (note_type, note_content) in enumerate(matches):
                note_type = note_type.strip()
                note_content = note_content.strip()
                summary = clean_html_for_summary(note_content)
                notes.append({
                    'id': f"{date_str.replace(' ', '_').replace(',', '')}_{idx}",
                    'date': date_str,
                    'updated': updated_str,
                    'type': note_type,
                    'content': note_content,
                    'summary': summary
                })
                
    return notes

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    current_time = time.time()
    
    if force_refresh or cache["data"] is None or (current_time - cache["last_fetched"]) > cache["expiry"]:
        try:
            releases = parse_release_feed()
            cache["data"] = releases
            cache["last_fetched"] = current_time
            source = "network"
        except Exception as e:
            # If fetch fails, return cached data if we have it, otherwise error
            if cache["data"] is not None:
                releases = cache["data"]
                source = "cache_fallback"
            else:
                return jsonify({"error": f"Failed to fetch feed: {str(e)}"}), 500
    else:
        releases = cache["data"]
        source = "cache"
        
    return jsonify({
        "releases": releases,
        "source": source,
        "last_fetched": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(cache["last_fetched"])),
        "count": len(releases)
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
