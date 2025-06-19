<?php
session_start();

// Simple user authentication system
class Auth {
    private static $usersFile = 'users/users.json';
    
    public static function init() {
        // Create users directory and file if they don't exist
        if (!file_exists('users')) {
            mkdir('users', 0755, true);
        }
        if (!file_exists(self::$usersFile)) {
            file_put_contents(self::$usersFile, json_encode([]));
        }
    }
    
    public static function register($username, $password, $email = '') {
        self::init();
        
        // Validate input
        if (empty($username) || empty($password)) {
            return ['success' => false, 'message' => 'Användarnamn och lösenord krävs'];
        }
        
        if (strlen($username) < 3) {
            return ['success' => false, 'message' => 'Användarnamnet måste vara minst 3 tecken'];
        }
        
        if (strlen($password) < 6) {
            return ['success' => false, 'message' => 'Lösenordet måste vara minst 6 tecken'];
        }
        
        // Load existing users
        $users = json_decode(file_get_contents(self::$usersFile), true) ?: [];
        
        // Check if user already exists
        foreach ($users as $user) {
            if ($user['username'] === $username) {
                return ['success' => false, 'message' => 'Användarnamnet är redan taget'];
            }
        }
        
        // Create new user
        $newUser = [
            'id' => uniqid(),
            'username' => $username,
            'password' => password_hash($password, PASSWORD_DEFAULT),
            'email' => $email,
            'created' => date('Y-m-d H:i:s')
        ];
        
        $users[] = $newUser;
        
        // Save users
        if (file_put_contents(self::$usersFile, json_encode($users, JSON_PRETTY_PRINT))) {
            // Create user data directory
            $userDir = 'users/' . $newUser['id'];
            if (!file_exists($userDir)) {
                mkdir($userDir, 0755, true);
            }
            
            return ['success' => true, 'message' => 'Konto skapat framgångsrikt'];
        } else {
            return ['success' => false, 'message' => 'Kunde inte skapa konto'];
        }
    }
    
    public static function login($username, $password) {
        self::init();
        
        // Load users
        $users = json_decode(file_get_contents(self::$usersFile), true) ?: [];
        
        // Find user
        foreach ($users as $user) {
            if ($user['username'] === $username) {
                if (password_verify($password, $user['password'])) {
                    // Set session
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['logged_in'] = true;
                    
                    return ['success' => true, 'message' => 'Inloggning lyckades'];
                } else {
                    return ['success' => false, 'message' => 'Felaktigt lösenord'];
                }
            }
        }
        
        return ['success' => false, 'message' => 'Användaren hittades inte'];
    }
    
    public static function logout() {
        session_destroy();
        return ['success' => true, 'message' => 'Utloggad'];
    }
    
    public static function isLoggedIn() {
        return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
    }
    
    public static function getCurrentUser() {
        if (self::isLoggedIn()) {
            return [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username']
            ];
        }
        return null;
    }
    
    public static function requireLogin() {
        if (!self::isLoggedIn()) {
            http_response_code(401);
            echo json_encode(['error' => 'Inloggning krävs']);
            exit;
        }
    }
}

// Handle API requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    switch ($action) {
        case 'register':
            $result = Auth::register($input['username'], $input['password'], $input['email'] ?? '');
            echo json_encode($result);
            break;
            
        case 'login':
            $result = Auth::login($input['username'], $input['password']);
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
