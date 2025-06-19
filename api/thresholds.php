<?php
session_start();
require_once __DIR__ . '/../includes/Auth.php';
header('Content-Type: application/json');

// Require authentication
Auth::requireLogin();
$user = Auth::getCurrentUser();

// User-specific thresholds file
$userDir = __DIR__ . '/../users/' . $user['id'];
if (!file_exists($userDir)) {
    mkdir($userDir, 0755, true);
}
$jsonFile = $userDir . '/thresholds.json';

// Default thresholds
$defaultThresholds = [
    'roas' => ['low' => 1.5, 'high' => 2.0],
    'poas' => ['low' => 1.0, 'high' => 1.5],
    'grossMarginPercent' => ['low' => 15, 'high' => 20],
    'netProfitPercent' => ['low' => 5, 'high' => 10],
    'marketingPercent' => ['low' => 10, 'high' => 15],
    'revenue' => ['low' => 50000, 'high' => 100000],
    'grossprofit' => ['low' => 25000, 'high' => 50000],
    'marketingSpend' => ['low' => 10000, 'high' => 25000],
    'nettovinst' => ['low' => 15000, 'high' => 30000],
    'lostMargin' => ['low' => 70, 'high' => 80],
    'marketingShareOfGrossprofit' => ['low' => 30, 'high' => 50],
    'netProfitPerAdCrown' => ['low' => 0.5, 'high' => 1.0],
    'poasRoasRatio' => ['low' => 0.8, 'high' => 1.2]
];

// Handle POST request (save thresholds)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input && is_array($input)) {
        // Validate the structure - check that each provided key has low/high values
        $valid = true;

        foreach ($input as $key => $value) {
            if (!is_array($value) || !isset($value['low']) || !isset($value['high'])) {
                $valid = false;
                break;
            }
        }
        
        if ($valid) {
            // Save to JSON file
            $jsonData = json_encode($input, JSON_PRETTY_PRINT);
            if (file_put_contents($jsonFile, $jsonData) !== false) {
                echo json_encode(['success' => true, 'message' => 'Thresholds saved successfully']);
                exit;
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Could not save thresholds to file.']);
                exit;
            }
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid threshold data structure.']);
            exit;
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input data.']);
        exit;
    }
}

// Handle GET request (load thresholds)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($jsonFile)) {
        $jsonData = file_get_contents($jsonFile);
        $thresholds = json_decode($jsonData, true);
        
        if ($thresholds !== null) {
            echo json_encode($thresholds);
            exit;
        } else {
            // File exists but contains invalid JSON, return defaults
            echo json_encode($defaultThresholds);
            exit;
        }
    } else {
        // File doesn't exist, create it with defaults and return defaults
        $jsonData = json_encode($defaultThresholds, JSON_PRETTY_PRINT);
        file_put_contents($jsonFile, $jsonData);
        echo json_encode($defaultThresholds);
        exit;
    }
}

// Handle unsupported methods
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>
