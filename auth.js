// Authentication utilities for Smart Inventory Management System

// Check if user is authenticated
function isAuthenticated() {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return (user && token);
}

// Protect page by redirecting to signin if not authenticated
function protectPage() {
    if (!isAuthenticated()) {
        console.log('User not authenticated, redirecting to signin page');
        window.location.href = 'signin.html';
        return false;
    }
    return true;
}

// Handle sign out
function handleSignOut(event) {
    if (event) event.preventDefault();
    // Clear authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Redirect to index page
    window.location.href = 'index.html';
}

// Get user data
function getUserData() {
    try {
        const userData = JSON.parse(localStorage.getItem('user'));
        return userData || {};
    } catch (error) {
        console.error('Error parsing user data:', error);
        return {};
    }
}

// Get authentication token
function getAuthToken() {
    return localStorage.getItem('token');
}

// Update signout buttons with event handlers
document.addEventListener('DOMContentLoaded', function() {
    // Add click handler to all signout buttons
    const signoutButtons = document.querySelectorAll('.signout-btn');
    signoutButtons.forEach(button => {
        button.addEventListener('click', handleSignOut);
    });
    
    // Display username if element exists
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
        const userData = getUserData();
        if (userData.name) {
            usernameElement.textContent = userData.name;
        }
    }
}); 