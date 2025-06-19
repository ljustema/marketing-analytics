<?php
// API endpoint for authentication
session_start();
require_once __DIR__ . '/../includes/Auth.php';

// Handle API requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'register':
            $result = Auth::register($input['email'], $input['password'], $input['username'] ?? '');
            echo json_encode($result);
            break;

        case 'login':
            $result = Auth::login($input['email'], $input['password']);
            echo json_encode($result);
            break;
            
        case 'logout':
            $result = Auth::logout();
            echo json_encode($result);
            break;
            
        case 'check':
            echo json_encode([
                'logged_in' => Auth::isLoggedIn(),
                'user' => Auth::getCurrentUser()
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Okänd åtgärd']);
    }
    exit;
}

// For GET requests, return current auth status
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'logged_in' => Auth::isLoggedIn(),
        'user' => Auth::getCurrentUser()
    ]);
    exit;
}
?>
