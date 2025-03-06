// Remove Materialize initialization
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
});

// Theme Management
const themeToggleBtn = document.querySelector('#themeToggleBtn');
const themeIcon = document.querySelector('#themeIcon');
const htmlElement = document.documentElement;

// Initialize theme from localStorage or system preference
const initializeTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        htmlElement.setAttribute('data-bs-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = prefersDark ? 'dark' : 'light';
        htmlElement.setAttribute('data-bs-theme', initialTheme);
        updateThemeIcon(initialTheme);
    }
};

// Update theme icon based on current theme
const updateThemeIcon = (theme) => {
    themeIcon.className = theme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
};

// Toggle theme
themeToggleBtn.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
});

// Toast notifications
const showToast = (message, type = 'success') => {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
};

// Bookmark class
class Bookmark {
    constructor(url, title, tags = [], description = '') {
        this.url = url;
        this.title = title;
        this.tags = tags;
        this.description = description;
        this.dateAdded = new Date();
        this.preview = '';
    }
}

// BookmarkManager class
class BookmarkManager {
    constructor() {
        this.bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
        this.tags = new Set();
        this.activeTag = null;
        this.searchQuery = '';
        this.editingBookmarkId = null;
        this.initializeEventListeners();
        this.updateTagsList();
        this.displayBookmarks();
    }

    initializeEventListeners() {
        // Form submission
        document.getElementById('bookmarkForm').addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.editingBookmarkId) {
                this.updateBookmark();
            } else {
                this.addBookmark();
            }
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.displayBookmarks();
        });

        // Modal events
        const addBookmarkModal = document.getElementById('addBookmarkModal');
        addBookmarkModal.addEventListener('hidden.bs.modal', () => {
            this.resetForm();
        });
    }

    resetForm() {
        document.getElementById('bookmarkForm').reset();
        document.getElementById('bookmarkId').value = '';
        this.editingBookmarkId = null;
        document.querySelector('#addBookmarkModal .modal-title').textContent = 'Add New Bookmark';
    }

    async addBookmark() {
        const url = document.getElementById('urlInput').value;
        const customTitle = document.getElementById('titleInput').value;
        const customDescription = document.getElementById('descriptionInput').value;
        const tags = document.getElementById('tagsInput').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);

        try {
            const metadata = await this.getMetadata(url);
            const bookmark = {
                id: Date.now(),
                url,
                title: customTitle || metadata.title || new URL(url).hostname,
                description: customDescription || metadata.description || '',
                image: metadata.image,
                favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`,
                tags,
                createdAt: new Date().toISOString()
            };

            this.bookmarks.unshift(bookmark);
            this.saveBookmarks();
            this.updateTagsList();
            this.displayBookmarks();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addBookmarkModal'));
            modal.hide();

            showToast('Bookmark added successfully!');
        } catch (error) {
            console.error('Error adding bookmark:', error);
            showToast('Error adding bookmark. Please try again.', 'danger');
        }
    }

    async updateBookmark() {
        const bookmarkId = parseInt(document.getElementById('bookmarkId').value);
        const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
        
        if (!bookmark) {
            showToast('Bookmark not found.', 'danger');
            return;
        }

        try {
            bookmark.title = document.getElementById('titleInput').value || bookmark.title;
            bookmark.description = document.getElementById('descriptionInput').value;
            bookmark.tags = document.getElementById('tagsInput').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag);

            this.saveBookmarks();
            this.updateTagsList();
            this.displayBookmarks();

            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('addBookmarkModal'));
            modal.hide();

            showToast('Bookmark updated successfully!');
        } catch (error) {
            console.error('Error updating bookmark:', error);
            showToast('Error updating bookmark. Please try again.', 'danger');
        }
    }

    editBookmark(id) {
        const bookmark = this.bookmarks.find(b => b.id === id);
        if (!bookmark) return;

        this.editingBookmarkId = id;
        document.getElementById('bookmarkId').value = id;
        document.getElementById('urlInput').value = bookmark.url;
        document.getElementById('titleInput').value = bookmark.title || '';
        document.getElementById('descriptionInput').value = bookmark.description || '';
        document.getElementById('tagsInput').value = bookmark.tags.join(', ');

        document.querySelector('#addBookmarkModal .modal-title').textContent = 'Edit Bookmark';
        const modal = new bootstrap.Modal(document.getElementById('addBookmarkModal'));
        modal.show();
    }

    async getMetadata(url) {
        try {
            // For YouTube videos
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const videoId = this.getYouTubeVideoId(url);
                if (videoId) {
                    try {
                        // Try to get video metadata from YouTube oEmbed
                        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
                        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(oembedUrl)}`);
                        if (response.ok) {
                            const data = await response.json();
                            return {
                                title: data.title,
                                description: '',
                                image: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
                            };
                        }
                    } catch (error) {
                        console.warn('Failed to get YouTube metadata:', error);
                    }
                    // Fallback to basic info
                    return {
                        title: 'YouTube Video',
                        description: '',
                        image: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
                    };
                }
            }

            // For X/Twitter posts
            if (url.includes('twitter.com') || url.includes('x.com')) {
                try {
                    // Use APIFlash for reliable Twitter screenshots
                    return {
                        title: 'Tweet',
                        description: '',
                        image: `https://api.apiflash.com/v1/urltoimage?access_key=9e0d8b41b5a34a788fc3058b58c0e45a&url=${encodeURIComponent(url)}&format=jpeg&width=600&height=400&response_type=image&fresh=true`
                    };
                } catch (error) {
                    console.warn('Failed to get Twitter preview:', error);
                }
            }

            // Try multiple proxy services for other URLs
            const proxyUrls = [
                `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                `https://corsproxy.io/?${encodeURIComponent(url)}`,
                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
            ];

            let html = null;
            for (const proxyUrl of proxyUrls) {
                try {
                    const response = await fetch(proxyUrl);
                    if (response.ok) {
                        html = await response.text();
                        break;
                    }
                } catch (error) {
                    console.warn('Proxy failed:', proxyUrl, error);
                    continue;
                }
            }

            if (!html) {
                throw new Error('All proxies failed');
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Try OpenGraph image with multiple fallbacks
            let image = doc.querySelector('meta[property="og:image"]')?.content ||
                       doc.querySelector('meta[property="og:image:secure_url"]')?.content ||
                       doc.querySelector('meta[name="twitter:image"]')?.content ||
                       doc.querySelector('meta[name="twitter:image:src"]')?.content;

            // Try OpenGraph title with multiple fallbacks
            let title = doc.querySelector('meta[property="og:title"]')?.content ||
                       doc.querySelector('meta[name="twitter:title"]')?.content ||
                       doc.querySelector('title')?.textContent ||
                       new URL(url).hostname;

            // Get a short description (one line only)
            let description = '';
            const possibleDescriptions = [
                doc.querySelector('meta[property="og:description"]')?.content,
                doc.querySelector('meta[name="twitter:description"]')?.content,
                doc.querySelector('meta[name="description"]')?.content
            ].filter(Boolean);

            if (possibleDescriptions.length > 0) {
                description = possibleDescriptions
                    .sort((a, b) => a.length - b.length)[0]
                    .split('\n')[0]
                    .substring(0, 100)
                    .trim();
                if (description.length === 100) description += '...';
            }

            // Make sure image URL is absolute
            if (image && !image.startsWith('http')) {
                const urlObj = new URL(url);
                image = new URL(image, urlObj.origin).toString();
            }

            // If no image found, use APIFlash as fallback for screenshots
            if (!image) {
                image = `https://api.apiflash.com/v1/urltoimage?access_key=9e0d8b41b5a34a788fc3058b58c0e45a&url=${encodeURIComponent(url)}&format=jpeg&width=600&height=400&response_type=image&fresh=true`;
            }

            return {
                title: title || new URL(url).hostname,
                description: description || '',
                image: image
            };
        } catch (error) {
            console.error('Error getting metadata:', error);
            // Use APIFlash as final fallback for any URL
            return {
                title: new URL(url).hostname,
                description: '',
                image: `https://api.apiflash.com/v1/urltoimage?access_key=9e0d8b41b5a34a788fc3058b58c0e45a&url=${encodeURIComponent(url)}&format=jpeg&width=600&height=400&response_type=image&fresh=true`
            };
        }
    }

    getYouTubeVideoId(url) {
        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[7].length === 11) ? match[7] : null;
    }

    deleteBookmark(id) {
        const confirmModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        document.getElementById('confirm-delete').onclick = () => {
            this.bookmarks = this.bookmarks.filter(b => b.id !== id);
            this.saveBookmarks();
            this.updateTagsList();
            this.displayBookmarks();
            confirmModal.hide();
            showToast('Bookmark deleted successfully!');
        };
        confirmModal.show();
    }

    saveBookmarks() {
        localStorage.setItem('bookmarks', JSON.stringify(this.bookmarks));
    }

    updateTagsList() {
        this.tags = new Set(this.bookmarks.flatMap(b => b.tags));
        const tagsList = document.getElementById('tags-filter');
        tagsList.innerHTML = '';

        // Add "All" tag
        const allTag = document.createElement('a');
        allTag.href = '#';
        allTag.className = `tag me-2 mb-2 ${!this.activeTag ? 'active' : ''}`;
        allTag.textContent = 'All';
        allTag.onclick = (e) => {
            e.preventDefault();
            this.activeTag = null;
            this.displayBookmarks();
            document.querySelectorAll('#tags-filter .tag').forEach(t => t.classList.remove('active'));
            allTag.classList.add('active');
        };
        tagsList.appendChild(allTag);

        // Add other tags
        Array.from(this.tags).sort().forEach(tag => {
            const tagElement = document.createElement('a');
            tagElement.href = '#';
            tagElement.className = `tag me-2 mb-2 ${this.activeTag === tag ? 'active' : ''}`;
            tagElement.textContent = tag;
            tagElement.onclick = (e) => {
                e.preventDefault();
                this.activeTag = tag;
                this.displayBookmarks();
                document.querySelectorAll('#tags-filter .tag').forEach(t => t.classList.remove('active'));
                tagElement.classList.add('active');
            };
            tagsList.appendChild(tagElement);
        });
    }

    displayBookmarks() {
        const bookmarksContainer = document.getElementById('bookmarks-container');
        const filteredBookmarks = this.bookmarks.filter(bookmark => {
            const matchesSearch = bookmark.title.toLowerCase().includes(this.searchQuery) ||
                                bookmark.url.toLowerCase().includes(this.searchQuery) ||
                                bookmark.description.toLowerCase().includes(this.searchQuery) ||
                                bookmark.tags.some(tag => tag.toLowerCase().includes(this.searchQuery));
            const matchesTag = !this.activeTag || bookmark.tags.includes(this.activeTag);
            return matchesSearch && matchesTag;
        });

        if (filteredBookmarks.length === 0) {
            bookmarksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-bookmark-heart"></i>
                    <h3>No bookmarks found</h3>
                    <p class="text-muted">Try adjusting your search or filters, or add some bookmarks!</p>
                </div>
            `;
            return;
        }

        bookmarksContainer.innerHTML = filteredBookmarks.map(bookmark => `
            <div class="col-12 col-md-6 col-lg-4">
                <div class="bookmark-card">
                    <div class="bookmark-actions">
                        <button class="action-btn" onclick="bookmarkManager.editBookmark(${bookmark.id})" 
                                data-bs-toggle="tooltip" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="bookmarkManager.deleteBookmark(${bookmark.id})"
                                data-bs-toggle="tooltip" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    <a href="${bookmark.url}" class="bookmark-link" target="_blank" rel="noopener noreferrer">
                        <div class="bookmark-preview" style="background-image: url('${bookmark.image || ''}')">
                            ${!bookmark.image ? `<div class="bookmark-favicon-large">
                                <img src="${bookmark.favicon}" alt="Favicon" onerror="this.style.display='none'">
                            </div>` : ''}
                        </div>
                        <div class="bookmark-content">
                            <h3 class="bookmark-title">${bookmark.title}</h3>
                            <div class="bookmark-meta">
                                <span class="bookmark-url">
                                    <i class="bi bi-link-45deg"></i>
                                    ${new URL(bookmark.url).hostname}
                                </span>
                                <span class="bookmark-date">
                                    <i class="bi bi-calendar3"></i>
                                    ${new Date(bookmark.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            ${bookmark.description ? `
                                <p class="bookmark-description">${bookmark.description}</p>
                            ` : ''}
                            <div class="bookmark-tags">
                                ${bookmark.tags.map(tag => `
                                    <span class="tag" onclick="bookmarkManager.filterByTag('${tag}')">
                                        ${tag}
                                    </span>
                                `).join('')}
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        `).join('');

        // Initialize tooltips for new elements
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        tooltips.forEach(tooltip => new bootstrap.Tooltip(tooltip));
    }

    filterByTag(tag) {
        this.activeTag = tag;
        this.displayBookmarks();
        document.querySelectorAll('#tags-filter .tag').forEach(t => {
            t.classList.toggle('active', t.textContent === tag);
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    window.bookmarkManager = new BookmarkManager();
});

