const SERVER_URL = 'http://188.165.254.184:8102';

// Function to initialize the site
function initializeSite() {
    // Check which page we're on and perform corresponding actions
    if (document.getElementById('song-list')) {
        fetchAndDisplaySongs(); // Fetch and display songs on index or info page
    }

    if (document.getElementById('stats')) {
        fetchAndDisplayStats(); // Fetch and display stats on stats page
    }

    if (document.getElementById('admin-section')) {
        setupAdmin(); // Set up admin functionalities on the admin page
    }
}

// Function to send play statistics to the server
function sendPlayStats(trackTitle) {
    fetch(`${SERVER_URL}/api/play`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ track: trackTitle })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Play stats sent:', data);
    })
    .catch(error => {
        console.error('Error sending play stats:', error);
    });
}

// Function to fetch and display statistics on stats.html
function fetchAndDisplayStats() {
    fetch(`${SERVER_URL}/api/stats`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('totalPlays').innerText = data.totalPlays;

        // Create a chart for plays per track
        const ctx = document.getElementById('playCountChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.playCounts.map(item => item.track),
                datasets: [{
                    label: 'Plays',
                    data: data.playCounts.map(item => item.count),
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    })
    .catch(error => {
        console.error('Error fetching stats:', error);
    });
}

// Function to set up admin functionalities on admin.html
function setupAdmin() {
    const token = localStorage.getItem('adminToken');
    if (token) {
        displayAdminDashboard(token); // Show dashboard if logged in
    } else {
        displayAdminLogin(); // Show login form if not logged in
    }
}

// Function to display admin login form
function displayAdminLogin() {
    const adminDiv = document.getElementById('admin-section');
    adminDiv.innerHTML = `
        <h3>Admin Login</h3>
        <form id="admin-login-form">
            <div class="mb-3">
                <label for="admin-username" class="form-label">Username</label>
                <input type="text" class="form-control" id="admin-username" required>
            </div>
            <div class="mb-3">
                <label for="admin-password" class="form-label">Password</label>
                <input type="password" class="form-control" id="admin-password" required>
            </div>
            <button type="submit" class="btn btn-primary">Login</button>
        </form>
    `;

    // Handle form submission for login
    document.getElementById('admin-login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        authenticateAdmin(username, password);
    });
}

// Function to authenticate admin
function authenticateAdmin(username, password) {
    fetch(`${SERVER_URL}/api/admin/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.token) {
            localStorage.setItem('adminToken', data.token);
            displayAdminDashboard(data.token);
        } else {
            alert('Invalid credentials. Please try again.');
        }
    })
    .catch(error => {
        console.error('Error during admin authentication:', error);
    });
}

// Function to display admin dashboard after authentication
function displayAdminDashboard(token) {
    const adminDiv = document.getElementById('admin-section');
    adminDiv.innerHTML = `
        <h3>Welcome, Admin!</h3>
        <button id="logout-button" class="btn btn-danger mb-3">Logout</button>
        <div class="chart-container">
            <canvas id="adminPlayCountChart"></canvas>
        </div>
        <h4 class="mt-4">Total Plays: <span id="adminTotalPlays">0</span></h4>
    `;

    // Handle admin logout
    document.getElementById('logout-button').addEventListener('click', function() {
        localStorage.removeItem('adminToken');
        displayAdminLogin();
    });

    // Fetch and display admin stats
    fetchAdminStats(token);
}

// Function to fetch and display admin statistics
function fetchAdminStats(token) {
    fetch(`${SERVER_URL}/api/admin/stats`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('adminTotalPlays').innerText = data.totalPlays;

        // Create a pie chart for plays per track
        const ctx = document.getElementById('adminPlayCountChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.playCounts.map(item => item.track),
                datasets: [{
                    label: 'Plays',
                    data: data.playCounts.map(item => item.count),
                    backgroundColor: generateColorPalette(data.playCounts.length),
                    borderColor: '#fff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true
            }
        });
    })
    .catch(error => {
        console.error('Error fetching admin stats:', error);
    });
}

// Utility function to generate a color palette for charts
function generateColorPalette(numColors) {
    const colors = [];
    for (let i = 0; i < numColors; i++) {
        const r = Math.floor(Math.random() * 156) + 100; // Generate colors in the range 100-255
        const g = Math.floor(Math.random() * 156) + 100;
        const b = Math.floor(Math.random() * 156) + 100;
        colors.push(`rgba(${r}, ${g}, ${b}, 0.6)`);
    }
    return colors;
}

// Function to fetch and display songs on index.html and info.html
function fetchAndDisplaySongs() {
    fetch(`${SERVER_URL}/api/songs`)
    .then(response => response.json())
    .then(songs => {
        const songListContainer = document.getElementById('song-list');
        const loadingIndicator = document.getElementById('loading');
        if (loadingIndicator) {
            loadingIndicator.remove(); // Remove loading indicator once songs are fetched
        }

        songs.forEach(song => {
            const songCard = document.createElement('div');
            songCard.classList.add('col-md-6', 'col-lg-4', 'mb-4');

            songCard.innerHTML = `
                <div class="card shadow-sm">
                    <img src="images/${song.albumArt}" class="card-img-top" alt="${song.title} Album Art">
                    <div class="card-body">
                        <h5 class="card-title">${song.title}</h5>
                        <p class="card-text">${song.artist}</p>
                        <audio class="form-control" controls>
                            <source src="songs/${song.fileName}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </div>
            `;

            songListContainer.appendChild(songCard);
        });

        // After adding new audio elements, add event listeners to track plays
        const audios = document.querySelectorAll('audio');
        audios.forEach(audio => {
            audio.addEventListener('play', () => {
                const trackTitle = audio.closest('.card').querySelector('.card-title').innerText;
                sendPlayStats(trackTitle);
            });
        });
    })
    .catch(error => {
        console.error('Error fetching songs:', error);
        const songListContainer = document.getElementById('song-list');
        songListContainer.innerHTML = `<p class="text-danger">Failed to load songs. Please try again later.</p>`;
    });
}

// Initialize the site when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeSite);
