# Mark-D
All in one book marker.
# MarkD - Your Smart Bookmarker

MarkD is a modern, beautiful bookmarking application that allows you to save and organize your favorite websites with tags and previews. Built with HTML, CSS, and JavaScript, using Material UI for a sleek design.

## Features

- 🎯 Save bookmarks with titles, descriptions, and tags
- 🏷️ Organize bookmarks with custom tags
- 🔍 Search through bookmarks and tags
- 👀 Preview websites with favicons
- 📱 Responsive design for all devices
- 💾 Local storage for persistent data
- 🎨 Modern and beautiful UI with Material Design

## Setup

1. Clone this repository:
```bash
git clone https://github.com/yourusername/markd.git
cd markd
```

2. Open `index.html` in your web browser

That's it! No additional setup required as this is a client-side only application.

## Usage

1. Click the "Add Bookmark" button to add a new bookmark
2. Enter the website URL, title, and optional description
3. Add tags (comma-separated) to organize your bookmarks
4. Use the search bar to find bookmarks by title, URL, or tags
5. Click on tags to filter bookmarks
6. Click "View All" to see all bookmarks

## Backend Integration

The application is designed to be easily integrated with a backend service. To integrate with Spring Boot:

1. Create API endpoints in your Spring Boot application:
   - GET /api/bookmarks - Get all bookmarks
   - POST /api/bookmarks - Create a new bookmark
   - DELETE /api/bookmarks/{id} - Delete a bookmark
   - GET /api/bookmarks/search - Search bookmarks

2. Modify the `BookmarkManager` class to use these endpoints instead of localStorage

## Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- Material UI
- Google Fonts
- Local Storage API

## Contributing

Feel free to submit issues and enhancement requests!

## License

