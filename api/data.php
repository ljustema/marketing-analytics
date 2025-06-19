<?php
session_start();
require_once __DIR__ . '/../includes/Auth.php';
header('Content-Type: application/json');

// Require authentication
Auth::requireLogin();
$user = Auth::getCurrentUser();

// User-specific CSV file
$userDir = __DIR__ . '/../users/' . $user['id'];
if (!file_exists($userDir)) {
    mkdir($userDir, 0755, true);
}
$csvFile = $userDir . '/data.csv';

// Handle POST request (append new data or bulk upload)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    // Handle bulk CSV upload
    if ($input && isset($input['action']) && $input['action'] === 'bulk_upload' && isset($input['data'])) {
        $bulkData = $input['data'];
        $successCount = 0;
        $errorCount = 0;

        // Check if file exists and has header
        $fileExists = file_exists($csvFile);
        $fp = fopen($csvFile, 'a');
        if ($fp) {
            // Add header if file is new
            if (!$fileExists || filesize($csvFile) == 0) {
                fputcsv($fp, ['month', 'revenue', 'grossprofit', 'marketingSpend']);
            }

            foreach ($bulkData as $rowData) {
                if (isset($rowData['month'], $rowData['revenue'], $rowData['grossprofit'], $rowData['marketingSpend'])) {
                    $row = [
                        $rowData['month'],
                        $rowData['revenue'],
                        $rowData['grossprofit'],
                        $rowData['marketingSpend']
                    ];
                    if (fputcsv($fp, $row)) {
                        $successCount++;
                    } else {
                        $errorCount++;
                    }
                } else {
                    $errorCount++;
                }
            }
            fclose($fp);

            echo json_encode([
                'success' => true,
                'message' => "Bulk upload complete: $successCount rows added, $errorCount errors",
                'successCount' => $successCount,
                'errorCount' => $errorCount
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Could not open CSV file for writing']);
        }
        exit;
    }

    // Handle single row addition
    if ($input && isset($input['month'], $input['revenue'], $input['grossprofit'], $input['marketingSpend'])) {
        // Check if file exists and has header
        $fileExists = file_exists($csvFile);
        $fp = fopen($csvFile, 'a');
        if ($fp) {
            // Add header if file is new
            if (!$fileExists || filesize($csvFile) == 0) {
                fputcsv($fp, ['month', 'revenue', 'grossprofit', 'marketingSpend']);
            }

            // Append new data as a new line
            $row = [
                $input['month'],
                $input['revenue'],
                $input['grossprofit'],
                $input['marketingSpend']
            ];
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

// Handle DELETE request (delete specific month data)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $monthToDelete = $_GET['month'] ?? null;

    if (!$monthToDelete) {
        http_response_code(400);
        echo json_encode(['error' => 'Month parameter is required for deletion.']);
        exit;
    }

    if (!file_exists($csvFile)) {
        http_response_code(404);
        echo json_encode(['error' => 'No data file found.']);
        exit;
    }

    // Read all data
    $data = [];
    $header = null;
    if (($handle = fopen($csvFile, 'r')) !== false) {
        $header = fgetcsv($handle); // Read header

        if ($header) {
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) >= count($header)) {
                    $item = array_combine($header, $row);
                    // Only keep rows that don't match the month to delete
                    if ($item['month'] !== $monthToDelete) {
                        $data[] = $row;
                    }
                }
            }
        }
        fclose($handle);
    }

    // Write back the filtered data
    if (($handle = fopen($csvFile, 'w')) !== false) {
        if ($header) {
            fputcsv($handle, $header);
        }
        foreach ($data as $row) {
            fputcsv($handle, $row);
        }
        fclose($handle);
        echo json_encode(['success' => true, 'message' => 'Data deleted successfully.']);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Could not write to CSV file.']);
        exit;
    }
}

// Handle GET request (return all data)
if (file_exists($csvFile) && ($handle = fopen($csvFile, 'r')) !== false) {
    $header = fgetcsv($handle); // Read header
    $data = [];

    if ($header) {
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) >= count($header)) {
                $item = array_combine($header, $row);
                // Handle both old and new field names for backward compatibility
                $marketingSpend = 0;
                if (isset($item['marketingSpend'])) {
                    $marketingSpend = (int)$item['marketingSpend'];
                } elseif (isset($item['marknadsföring'])) {
                    $marketingSpend = (int)$item['marknadsföring'];
                }

                $data[] = [
                    'month' => $item['month'] ?? '',
                    'revenue' => (int)($item['revenue'] ?? 0),
                    'grossprofit' => (int)($item['grossprofit'] ?? 0),
                    'marketingSpend' => $marketingSpend
                ];
            }
        }
    }
    fclose($handle);
    echo json_encode($data);
    exit;
} else {
    // File doesn't exist, return empty array
    echo json_encode([]);
    exit;
}
?>
