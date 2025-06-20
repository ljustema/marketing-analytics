<?php
session_start();

// Simple admin authentication (you can enhance this)
$adminPassword = 'admin123'; // Change this to a secure password

if (!isset($_SESSION['admin_logged_in'])) {
    if ($_POST['admin_password'] ?? '' === $adminPassword) {
        $_SESSION['admin_logged_in'] = true;
    } else {
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
                                <h5 class="card-title">Admin Login</h5>
                                <form method="POST">
                                    <div class="mb-3">
                                        <label for="admin_password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="admin_password" name="admin_password" required>
                                    </div>
                                    <button type="submit" class="btn btn-primary">Login</button>
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
}

// Admin is logged in, show user data
$usersFile = __DIR__ . '/users/users.json';
$users = [];

if (file_exists($usersFile)) {
    $users = json_decode(file_get_contents($usersFile), true) ?? [];
}

?>
<!DOCTYPE html>
<html>
<head>
    <title>Admin Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-light">
    <div class="container mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h1><i class="fas fa-users-cog me-2"></i>Admin Dashboard</h1>
            <a href="?logout=1" class="btn btn-outline-danger">
                <i class="fas fa-sign-out-alt me-2"></i>Logout
            </a>
        </div>

        <?php if (isset($_GET['logout'])): unset($_SESSION['admin_logged_in']); header('Location: admin.php'); exit; endif; ?>

        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title">Total Users</h5>
                        <h2 class="text-primary"><?= count($users) ?></h2>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <h5 class="card-title">Volume Path</h5>
                        <small class="text-muted"><?= __DIR__ . '/users' ?></small>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h5><i class="fas fa-users me-2"></i>User List</h5>
            </div>
            <div class="card-body">
                <?php if (empty($users)): ?>
                    <p class="text-muted">No users found.</p>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Created</th>
                                    <th>Data File</th>
                                    <th>Thresholds</th>
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
                                    $dataRows = 0;
                                    
                                    if (file_exists($dataFile) && $dataSize > 0) {
                                        $lines = file($dataFile);
                                        $dataRows = count($lines) - 1; // Subtract header
                                    }
                                    ?>
                                    <tr>
                                        <td><code><?= htmlspecialchars($user['id']) ?></code></td>
                                        <td><?= htmlspecialchars($user['email']) ?></td>
                                        <td><?= htmlspecialchars($user['username'] ?? 'N/A') ?></td>
                                        <td><?= date('Y-m-d H:i', $user['created']) ?></td>
                                        <td>
                                            <?php if ($dataSize > 0): ?>
                                                <span class="badge bg-success"><?= $dataRows ?> rows</span>
                                                <small class="text-muted">(<?= number_format($dataSize) ?> bytes)</small>
                                            <?php else: ?>
                                                <span class="badge bg-warning">No data</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if ($thresholdsSize > 0): ?>
                                                <span class="badge bg-info">Set</span>
                                                <small class="text-muted">(<?= number_format($thresholdsSize) ?> bytes)</small>
                                            <?php else: ?>
                                                <span class="badge bg-secondary">Default</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <a href="?view_data=<?= $user['id'] ?>" class="btn btn-sm btn-outline-primary">
                                                <i class="fas fa-eye"></i>
                                            </a>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <?php if (isset($_GET['view_data'])): ?>
            <?php
            $userId = $_GET['view_data'];
            $userDir = __DIR__ . '/users/' . $userId;
            $dataFile = $userDir . '/data.csv';
            ?>
            <div class="card mt-4">
                <div class="card-header">
                    <h5><i class="fas fa-chart-line me-2"></i>User Data: <?= htmlspecialchars($userId) ?></h5>
                </div>
                <div class="card-body">
                    <?php if (file_exists($dataFile)): ?>
                        <pre class="bg-light p-3" style="max-height: 400px; overflow-y: auto;"><?= htmlspecialchars(file_get_contents($dataFile)) ?></pre>
                    <?php else: ?>
                        <p class="text-muted">No data file found for this user.</p>
                    <?php endif; ?>
                </div>
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
