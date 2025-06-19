<?php
require_once 'auth.php';
header('Content-Type: application/json');

// Require authentication
Auth::requireLogin();
$user = Auth::getCurrentUser();

// User-specific CSV file
$userDir = 'users/' . $user['id'];
if (!file_exists($userDir)) {
    mkdir($userDir, 0755, true);
}
$csvFile = $userDir . '/data.csv';

// Handle POST request (append new data)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if ($input && isset($input['month'], $input['revenue'], $input['grossprofit'], $input['marketingSpend'])) {
        // Append new data as a new line
        $row = [
            $input['month'],
            $input['revenue'],
            $input['grossprofit'],
            $input['marketingSpend']
        ];
        $fp = fopen($csvFile, 'a');
        if ($fp) {
            fputcsv($fp, $row);
            fclose($fp);
            echo json_encode(['success' => true]);
            exit;
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Could not open CSV file for writing.']);
            exit;
        }
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input data.']);
        exit;
    }
}

// Handle GET request (return all data)
if (($handle = fopen($csvFile, 'r')) !== false) {
    $header = fgetcsv($handle); // Read header
    $data = [];
    while (($row = fgetcsv($handle)) !== false) {
        $item = array_combine($header, $row);
        // Use original keys, but convert to JS-friendly keys if needed
        $data[] = [
            'month' => $item['month'],
            'revenue' => (int)$item['revenue'],
            'grossprofit' => (int)$item['grossprofit'],
            'marketingSpend' => (int)$item['marknadsföring'] ?? (int)$item['marketingSpend']
        ];
    }
    fclose($handle);
    echo json_encode($data);
    exit;
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Could not open CSV file.']);
    exit;
}
?>
