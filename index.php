<?php
// Main entry point for the Marketing Analytics application
session_start();

// Simple routing based on the request
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);

// Remove any query parameters and normalize path
$path = strtok($path, '?');
$path = rtrim($path, '/');

// Route handling
switch ($path) {
    case '':
    case '/':
        // Main application - check if user is logged in
        require_once 'includes/Auth.php';
        if (Auth::isLoggedIn()) {
            include 'templates/index.html';
        } else {
            include 'templates/login.html';
        }
        break;
        
    case '/login':
        include 'templates/login.html';
        break;
        
    case '/app':
        // Force main app (for logged in users)
        require_once 'includes/Auth.php';
        if (Auth::isLoggedIn()) {
            include 'templates/index.html';
        } else {
            header('Location: /login');
            exit;
        }
        break;
        
    case '/api/auth':
        require 'api/auth.php';
        break;

    case '/api/data':
        require 'api/data.php';
        break;

    case '/api/thresholds':
        require 'api/thresholds.php';
        break;
        
    case '/src/script.js':
        header('Content-Type: application/javascript');
        include 'src/script.js';
        break;
        
    case '/src/styles.css':
        header('Content-Type: text/css');
        include 'src/styles.css';
        break;
        
    default:
        // Check if it's a static file request
        $filePath = ltrim($path, '/');
        if (file_exists($filePath) && is_file($filePath)) {
            // Serve static files
            $mimeType = mime_content_type($filePath);
            header('Content-Type: ' . $mimeType);
            readfile($filePath);
        } else {
            // 404 - redirect to main page
            header('HTTP/1.0 404 Not Found');
            include 'templates/login.html';
        }
        break;
}
?>
