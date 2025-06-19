<?php
// Simple user authentication system
// Note: session_start() should be called before including this file

class Auth {
    private static $usersFile;

    public static function init() {
        // Initialize paths
        if (!self::$usersFile) {
            self::$usersFile = __DIR__ . '/../users/users.json';
        }

        // Create users directory and file if they don't exist
        $usersDir = __DIR__ . '/../users';
        if (!file_exists($usersDir)) {
            mkdir($usersDir, 0755, true);
        }
        if (!file_exists(self::$usersFile)) {
            file_put_contents(self::$usersFile, json_encode([]));
        }
    }
    
    public static function register($email, $password, $username = '') {
        self::init();

        // Validate input
        if (empty($email) || empty($password)) {
            return ['success' => false, 'message' => 'E-post och lösenord krävs'];
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Ogiltig e-postadress'];
        }

        if (strlen($password) < 6) {
            return ['success' => false, 'message' => 'Lösenordet måste vara minst 6 tecken'];
        }

        // Generate username if not provided
        if (empty($username)) {
            $username = explode('@', $email)[0]; // Use part before @ as username
        }

        // Load existing users
        $users = json_decode(file_get_contents(self::$usersFile), true) ?: [];

        // Check if email already exists
        foreach ($users as $user) {
            if ($user['email'] === $email) {
                return ['success' => false, 'message' => 'E-postadressen är redan registrerad'];
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
            $userDir = __DIR__ . '/../users/' . $newUser['id'];
            if (!file_exists($userDir)) {
                mkdir($userDir, 0755, true);
            }

            // Copy sample data to new user directory
            self::initializeUserData($userDir);

            return ['success' => true, 'message' => 'Konto skapat framgångsrikt'];
        } else {
            return ['success' => false, 'message' => 'Kunde inte skapa konto'];
        }
    }
    
    public static function login($email, $password) {
        self::init();

        // Load users
        $users = json_decode(file_get_contents(self::$usersFile), true) ?: [];

        // Find user by email
        foreach ($users as $user) {
            if ($user['email'] === $email) {
                if (password_verify($password, $user['password'])) {
                    // Set session
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['username'] = $user['username'];
                    $_SESSION['email'] = $user['email'];
                    $_SESSION['logged_in'] = true;

                    return ['success' => true, 'message' => 'Inloggning lyckades'];
                } else {
                    return ['success' => false, 'message' => 'Felaktigt lösenord'];
                }
            }
        }

        return ['success' => false, 'message' => 'E-postadressen hittades inte'];
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
                'username' => $_SESSION['username'] ?? 'User',
                'email' => $_SESSION['email'] ?? ''
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

    private static function initializeUserData($userDir) {
        // Copy sample data to user directory if it exists
        $sampleDataFile = __DIR__ . '/../data/sample_data.csv';
        $sampleThresholdsFile = __DIR__ . '/../data/sample_thresholds.json';

        if (file_exists($sampleDataFile)) {
            copy($sampleDataFile, $userDir . '/data.csv');
        }

        if (file_exists($sampleThresholdsFile)) {
            copy($sampleThresholdsFile, $userDir . '/thresholds.json');
        }
    }
}
?>
