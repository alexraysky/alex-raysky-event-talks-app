// State Management
let state = {
    releases: [],
    selectedReleaseId: null,
    currentFilter: 'all',
    searchQuery: ''
};

// DOM elements cache
const elements = {
    releaseGrid: document.getElementById('releaseGrid'),
    refreshBtn: document.getElementById('refreshBtn'),
    searchInput: document.getElementById('searchInput'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    // Stats
    statTotal: document.getElementById('statTotal'),
    statFeatures: document.getElementById('statFeatures'),
    statIssues: document.getElementById('statIssues'),
    statDeprecations: document.getElementById('statDeprecations'),
    statLastSync: document.getElementById('statLastSync'),
    // Drawer
    tweetDrawer: document.getElementById('tweetDrawer'),
    drawerCloseBtn: document.getElementById('drawerCloseBtn'),
    drawerPreviewTitle: document.getElementById('drawerPreviewTitle'),
    drawerPreviewDate: document.getElementById('drawerPreviewDate'),
    drawerPreviewType: document.getElementById('drawerPreviewType'),
    composerTextarea: document.getElementById('composerTextarea'),
    charCounter: document.getElementById('charCounter'),
    btnCopyTweet: document.getElementById('btnCopyTweet'),
    btnPostTweet: document.getElementById('btnPostTweet'),
    // Toast
    toast: document.getElementById('toast')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    fetchReleases(false);
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Refresh button
    elements.refreshBtn.addEventListener('click', () => {
        fetchReleases(true);
    });

    // Search input
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        renderReleases();
    });

    // Filter buttons
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.currentFilter = btn.dataset.filter.toLowerCase();
            renderReleases();
        });
    });

    // Drawer close
    elements.drawerCloseBtn.addEventListener('click', closeDrawer);

    // Composer textarea input (character count)
    elements.composerTextarea.addEventListener('input', () => {
        updateCharCount();
    });

    // Copy tweet button
    elements.btnCopyTweet.addEventListener('click', copyTweetText);

    // Post tweet button
    elements.btnPostTweet.addEventListener('click', postTweet);

    // Close drawer when clicking outside card and drawer
    document.addEventListener('click', (e) => {
        const drawer = elements.tweetDrawer;
        const clickedInsideDrawer = drawer.contains(e.target);
        const clickedCard = e.target.closest('.release-card');
        const clickedRefresh = elements.refreshBtn.contains(e.target);
        
        if (!clickedInsideDrawer && !clickedCard && !clickedRefresh && drawer.classList.contains('open')) {
            closeDrawer();
        }
    });
}

// Fetch Releases from Backend API
async function fetchReleases(forceRefresh = false) {
    elements.refreshBtn.classList.add('loading');
    showShimmerLoader();

    try {
        const url = `/api/releases${forceRefresh ? '?refresh=true' : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        state.releases = data.releases || [];
        
        // Update stats
        elements.statTotal.textContent = data.count;
        elements.statLastSync.textContent = data.last_fetched ? data.last_fetched.split(' ')[1] : '--:--';
        
        // Calculate types count
        let features = 0, issues = 0, deprecations = 0;
        state.releases.forEach(r => {
            const type = r.type.toLowerCase();
            if (type.includes('feature')) features++;
            else if (type.includes('issue')) issues++;
            else if (type.includes('deprecation')) deprecations++;
        });
        
        elements.statFeatures.textContent = features;
        elements.statIssues.textContent = issues;
        elements.statDeprecations.textContent = deprecations;
        
        // Render
        renderReleases();
        
    } catch (error) {
        console.error("Failed to load release notes:", error);
        elements.releaseGrid.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>Failed to load BigQuery release notes. Please check your internet connection and try again.</p>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">Error details: ${error.message}</p>
            </div>
        `;
    } finally {
        elements.refreshBtn.classList.remove('loading');
    }
}

// Show Shimmer Loading effect
function showShimmerLoader() {
    elements.releaseGrid.innerHTML = `
        <div class="shimmer-wrapper">
            ${Array(6).fill(0).map(() => `
                <div class="shimmer-card">
                    <div class="shimmer-line header"></div>
                    <div class="shimmer-line meta"></div>
                    <div class="shimmer-line p1"></div>
                    <div class="shimmer-line p2"></div>
                    <div class="shimmer-line p3"></div>
                </div>
            `).join('')}
        </div>
    `;
}

// Filter and Render Releases List
function renderReleases() {
    // Filter logic
    let filtered = state.releases;
    
    // Type Filter
    if (state.currentFilter !== 'all') {
        filtered = filtered.filter(r => {
            const type = r.type.toLowerCase();
            if (state.currentFilter === 'features') return type.includes('feature');
            if (state.currentFilter === 'issues') return type.includes('issue');
            if (state.currentFilter === 'deprecations') return type.includes('deprecation');
            if (state.currentFilter === 'others') {
                return !type.includes('feature') && !type.includes('issue') && !type.includes('deprecation');
            }
            return true;
        });
    }
    
    // Search Filter
    if (state.searchQuery) {
        filtered = filtered.filter(r => {
            const content = r.content.toLowerCase();
            const date = r.date.toLowerCase();
            const type = r.type.toLowerCase();
            return content.includes(state.searchQuery) || date.includes(state.searchQuery) || type.includes(state.searchQuery);
        });
    }
    
    // Render
    if (filtered.length === 0) {
        elements.releaseGrid.innerHTML = `
            <div class="empty-state">
                <svg width="48" height="48" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <p>No release notes found matching the filters or query.</p>
            </div>
        `;
        return;
    }
    
    elements.releaseGrid.innerHTML = filtered.map(note => {
        const isSelected = note.id === state.selectedReleaseId;
        const cardClass = `release-card type-${getNormalizedType(note.type)}${isSelected ? ' selected' : ''}`;
        
        return `
            <article class="${cardClass}" onclick="handleCardClick(event, '${note.id}')">
                <div class="card-header">
                    <span class="type-pill">${note.type}</span>
                    <span class="release-date">${note.date}</span>
                </div>
                <div class="card-content">
                    ${note.content}
                </div>
                <div class="card-footer">
                    <button class="tweet-btn" onclick="handleDirectTweet(event, '${note.id}')">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        Tweet
                    </button>
                    <div class="select-indicator"></div>
                </div>
            </article>
        `;
    }).join('');
}

// Get standard lowercased type for CSS classes
function getNormalizedType(type) {
    const t = type.toLowerCase();
    if (t.includes('feature')) return 'feature';
    if (t.includes('issue')) return 'issue';
    if (t.includes('deprecation')) return 'deprecation';
    return 'update';
}

// Handle clicking on the release card (select and open drawer)
function handleCardClick(event, noteId) {
    // If the click is inside a link or the share button, don't open the full drawer
    if (event.target.tagName === 'A' || event.target.closest('a') || event.target.closest('.tweet-btn')) {
        return;
    }
    
    selectRelease(noteId);
}

// Select note and prepare tweet draft
function selectRelease(noteId) {
    const note = state.releases.find(r => r.id === noteId);
    if (!note) return;
    
    // Toggle/Set selection state
    if (state.selectedReleaseId === noteId) {
        // Already selected, let's close drawer
        closeDrawer();
        return;
    }
    
    state.selectedReleaseId = noteId;
    
    // Highlight card in DOM
    document.querySelectorAll('.release-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const cardEl = Array.from(document.querySelectorAll('.release-card')).find(card => card.innerHTML.includes(noteId));
    if (cardEl) {
        cardEl.classList.add('selected');
    }
    
    // Update Drawer Preview Details
    elements.drawerPreviewDate.textContent = note.date;
    elements.drawerPreviewType.textContent = note.type;
    // Set colors for preview pill
    elements.drawerPreviewType.className = `type-pill`;
    const normalizedType = getNormalizedType(note.type);
    elements.drawerPreviewType.parentElement.className = `preview-meta type-${normalizedType}`;
    
    // Auto Generate Draft Tweet
    const tweetText = generateTweetDraft(note);
    elements.composerTextarea.value = tweetText;
    
    // Show character count
    updateCharCount();
    
    // Open drawer
    elements.tweetDrawer.classList.add('open');
    
    // Re-render releases list to ensure select indicators are updated
    renderReleases();
}

// Generate Tweet Draft with limit constraints
function generateTweetDraft(note) {
    const date = note.date;
    const type = note.type;
    const summary = note.summary;
    const docUrl = "https://cloud.google.com/bigquery/docs/release-notes";
    
    const prefix = `🚀 BigQuery Update (${date}) | ${type}:\n`;
    const suffix = `\n\nRead more: ${docUrl}\n#BigQuery #GoogleCloud`;
    
    // 280 characters limit on X
    const maxSummaryLen = 280 - prefix.length - suffix.length;
    
    let finalSummary = summary;
    if (summary.length > maxSummaryLen) {
        finalSummary = summary.substring(0, maxSummaryLen - 4) + '...';
    }
    
    return `${prefix}${finalSummary}${suffix}`;
}

// Close Drawer
function closeDrawer() {
    state.selectedReleaseId = null;
    elements.tweetDrawer.classList.remove('open');
    renderReleases();
}

// Update Character count indicator
function updateCharCount() {
    const text = elements.composerTextarea.value;
    const len = text.length;
    
    elements.charCounter.textContent = `${len} / 280`;
    
    if (len > 280) {
        elements.charCounter.classList.add('warning');
        elements.btnPostTweet.disabled = true;
    } else {
        elements.charCounter.classList.remove('warning');
        elements.btnPostTweet.disabled = false;
    }
}

// Copy Tweet text to Clipboard
async function copyTweetText() {
    const text = elements.composerTextarea.value;
    try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard!");
    } catch (err) {
        console.error("Clipboard copy failed:", err);
        // Fallback copy
        elements.composerTextarea.select();
        document.execCommand('copy');
        showToast("Copied to clipboard!");
    }
}

// Post Tweet to X / Twitter
function postTweet() {
    const text = elements.composerTextarea.value;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// Direct quick tweet button click (on the card directly)
function handleDirectTweet(event, noteId) {
    event.stopPropagation(); // Stop click from triggering card selection drawer open
    const note = state.releases.find(r => r.id === noteId);
    if (!note) return;
    
    const tweetText = generateTweetDraft(note);
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, '_blank');
}

// Toast notification display helper
function showToast(message) {
    elements.toast.innerHTML = `
        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7"></path>
        </svg>
        <span>${message}</span>
    `;
    elements.toast.classList.add('show');
    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 2500);
}
