<?php
session_start();

// Simple admin authentication (change this password!)
$adminPassword = 'sfdg098745jhjfg!'; // TODO: Change this to a secure password

// Handle logout
if (isset($_GET['logout'])) {
    unset($_SESSION['admin_logged_in']);
    header('Location: admin.php');
    exit;
}

// Handle login
if (!isset($_SESSION['admin_logged_in'])) {
    // Check if login form was submitted
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['admin_password'])) {
        if ($_POST['admin_password'] === $adminPassword) {
            $_SESSION['admin_logged_in'] = true;
            // Redirect to prevent form resubmission
            header('Location: admin.php');
            exit;
        } else {
            $loginError = true;
        }
    }

    // Show login form (either first visit or wrong password)
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Admin Login</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
        <div class="container mt-5">
            <div class="row justify-content-center">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title text-center">🔐 Admin Login</h5>
                            <?php if (isset($loginError)): ?>
                                <div class="alert alert-danger">Invalid password</div>
                            <?php endif; ?>
                            <form method="POST">
                                <div class="mb-3">
                                    <label for="admin_password" class="form-label">Password</label>
                                    <input type="password" class="form-control" id="admin_password" name="admin_password" required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">Login</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    <?php
    exit;
}

// Handle user deletion
if (isset($_POST['delete_user'])) {
    $userId = $_POST['user_id'];
    $usersFile = __DIR__ . '/users/users.json';

    if (file_exists($usersFile)) {
        $users = json_decode(file_get_contents($usersFile), true) ?? [];

        // Remove user from users.json
        $users = array_filter($users, function($user) use ($userId) {
            return $user['id'] !== $userId;
        });

        // Save updated users.json
        file_put_contents($usersFile, json_encode(array_values($users), JSON_PRETTY_PRINT));

        // Delete user directory and all files
        $userDir = __DIR__ . '/users/' . $userId;
        if (is_dir($userDir)) {
            // Delete all files in user directory
            $files = glob($userDir . '/*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file);
                }
            }
            // Delete the directory
            rmdir($userDir);
        }

        $deleteMessage = "User $userId deleted successfully!";
    }
}

// Load users
$usersFile = __DIR__ . '/users/users.json';
$users = [];

if (file_exists($usersFile)) {
    $users = json_decode(file_get_contents($usersFile), true) ?? [];
}

// Calculate volume usage
$totalSize = 0;
$usersDir = __DIR__ . '/users';
if (is_dir($usersDir)) {
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($usersDir));
    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $totalSize += $file->getSize();
        }
    }
}

function formatBytes($size, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
        $size /= 1024;
    }
    return round($size, $precision) . ' ' . $units[$i];
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</head>
<body class="bg-light">
    <div class="container mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1><i class="fas fa-users-cog me-2"></i>Admin Dashboard</h1>
            <a href="?logout=1" class="btn btn-outline-danger">
                <i class="fas fa-sign-out-alt me-2"></i>Logout
            </a>
        </div>

        <?php if (isset($deleteMessage)): ?>
            <div class="alert alert-success alert-dismissible fade show">
                <i class="fas fa-check-circle me-2"></i><?= htmlspecialchars($deleteMessage) ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        <?php endif; ?>

        <!-- Statistics Cards -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card text-center border-primary">
                    <div class="card-body">
                        <i class="fas fa-users fa-2x text-primary mb-2"></i>
                        <h5 class="card-title">Total Users</h5>
                        <h2 class="text-primary"><?= count($users) ?></h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center border-info">
                    <div class="card-body">
                        <i class="fas fa-hdd fa-2x text-info mb-2"></i>
                        <h5 class="card-title">Volume Usage</h5>
                        <h3 class="text-info"><?= formatBytes($totalSize) ?></h3>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card text-center border-secondary">
                    <div class="card-body">
                        <i class="fas fa-folder fa-2x text-secondary mb-2"></i>
                        <h5 class="card-title">Volume Path</h5>
                        <code class="text-muted"><?= __DIR__ . '/users' ?></code>
                    </div>
                </div>
            </div>
        </div>

        <!-- Users Table -->
        <div class="card">
            <div class="card-header">
                <h5><i class="fas fa-users me-2"></i>User Management</h5>
            </div>
            <div class="card-body">
                <?php if (empty($users)): ?>
                    <div class="text-center py-4">
                        <i class="fas fa-users fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No users found.</p>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead class="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Created</th>
                                    <th>Data</th>
                                    <th>Size</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($users as $user): ?>
                                    <?php
                                    $userDir = __DIR__ . '/users/' . $user['id'];
                                    $dataFile = $userDir . '/data.csv';
                                    $thresholdsFile = $userDir . '/thresholds.json';

                                    $dataSize = file_exists($dataFile) ? filesize($dataFile) : 0;
                                    $thresholdsSize = file_exists($thresholdsFile) ? filesize($thresholdsFile) : 0;
                                    $totalUserSize = $dataSize + $thresholdsSize;

                                    $dataRows = 0;
                                    if (file_exists($dataFile) && $dataSize > 0) {
                                        $lines = file($dataFile);
                                        $dataRows = max(0, count($lines) - 1); // Subtract header
                                    }
                                    ?>
                                    <tr>
                                        <td><code><?= htmlspecialchars(substr($user['id'], 0, 8)) ?>...</code></td>
                                        <td><?= htmlspecialchars($user['email']) ?></td>
                                        <td><?= htmlspecialchars($user['username'] ?? 'N/A') ?></td>
                                        <td>
                                            <?php
                                            $created = $user['created'];
                                            if (is_string($created)) {
                                                // If it's already a formatted string, just display it
                                                echo htmlspecialchars($created);
                                            } else {
                                                // If it's a timestamp, format it
                                                echo date('Y-m-d H:i', $created);
                                            }
                                            ?>
                                        </td>
                                        <td>
                                            <?php if ($dataRows > 0): ?>
                                                <span class="badge bg-success"><?= $dataRows ?> rows</span>
                                            <?php else: ?>
                                                <span class="badge bg-warning">No data</span>
                                            <?php endif; ?>
                                        </td>
                                        <td><?= formatBytes($totalUserSize) ?></td>
                                        <td>
                                            <div class="btn-group" role="group">
                                                <a href="?view_data=<?= $user['id'] ?>" class="btn btn-sm btn-outline-primary" title="View Data">
                                                    <i class="fas fa-eye"></i>
                                                </a>
                                                <button type="button" class="btn btn-sm btn-outline-danger"
                                                        onclick="confirmDelete('<?= htmlspecialchars($user['id']) ?>', '<?= htmlspecialchars($user['email']) ?>')"
                                                        title="Delete User">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- View User Data -->
        <?php if (isset($_GET['view_data'])): ?>
            <?php
            $userId = $_GET['view_data'];
            $userDir = __DIR__ . '/users/' . $userId;
            $dataFile = $userDir . '/data.csv';
            $thresholdsFile = $userDir . '/thresholds.json';

            // Find user email
            $userEmail = 'Unknown';
            foreach ($users as $user) {
                if ($user['id'] === $userId) {
                    $userEmail = $user['email'];
                    break;
                }
            }
            ?>
            <div class="card mt-4">
                <div class="card-header">
                    <h5><i class="fas fa-chart-line me-2"></i>User Data: <?= htmlspecialchars($userEmail) ?></h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Data File (data.csv)</h6>
                            <?php if (file_exists($dataFile)): ?>
                                <pre class="bg-light p-3" style="max-height: 300px; overflow-y: auto; font-size: 12px;"><?= htmlspecialchars(file_get_contents($dataFile)) ?></pre>
                            <?php else: ?>
                                <p class="text-muted">No data file found.</p>
                            <?php endif; ?>
                        </div>
                        <div class="col-md-6">
                            <h6>Thresholds (thresholds.json)</h6>
                            <?php if (file_exists($thresholdsFile)): ?>
                                <pre class="bg-light p-3" style="max-height: 300px; overflow-y: auto; font-size: 12px;"><?= htmlspecialchars(file_get_contents($thresholdsFile)) ?></pre>
                            <?php else: ?>
                                <p class="text-muted">No thresholds file found.</p>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </div>

    <!-- Delete Confirmation Modal -->
    <div class="modal fade" id="deleteModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-exclamation-triangle text-danger me-2"></i>Confirm Deletion</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to delete user <strong id="deleteUserEmail"></strong>?</p>
                    <p class="text-danger"><i class="fas fa-warning me-1"></i>This will permanently delete:</p>
                    <ul class="text-danger">
                        <li>User account</li>
                        <li>All CSV data</li>
                        <li>Threshold settings</li>
                        <li>User directory</li>
                    </ul>
                    <p><strong>This action cannot be undone!</strong></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <form method="POST" style="display: inline;">
                        <input type="hidden" name="user_id" id="deleteUserId">
                        <button type="submit" name="delete_user" class="btn btn-danger">
                            <i class="fas fa-trash me-2"></i>Delete User
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>
    function confirmDelete(userId, userEmail) {
        document.getElementById('deleteUserId').value = userId;
        document.getElementById('deleteUserEmail').textContent = userEmail;
        new bootstrap.Modal(document.getElementById('deleteModal')).show();
    }
    </script>
</body>
</html>
