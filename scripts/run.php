<?php
/**
 * Script runner - similar to npm scripts
 * Usage: php scripts/run.php [command]
 */

if ($argc < 2) {
    echo "Usage: php scripts/run.php [command]\n\n";
    echo "Available commands:\n";
    echo "  lint     - Run PHP linting and error checks\n";
    echo "  build    - Run build and deployment readiness check\n";
    echo "  test     - Run all checks (lint + build)\n";
    echo "  serve    - Start development server\n";
    echo "  help     - Show this help message\n";
    exit(1);
}

$command = $argv[1];

switch ($command) {
    case 'lint':
        echo "Running PHP linter...\n\n";
        $exitCode = 0;
        passthru("php " . __DIR__ . "/lint.php", $exitCode);
        exit($exitCode);
        
    case 'build':
        echo "Running build check...\n\n";
        $exitCode = 0;
        passthru("php " . __DIR__ . "/build.php", $exitCode);
        exit($exitCode);
        
    case 'test':
        echo "Running all checks...\n\n";
        
        // Run lint first
        echo "Step 1/2: Linting\n";
        echo "==================\n";
        $lintExitCode = 0;
        passthru("php " . __DIR__ . "/lint.php", $lintExitCode);
        
        echo "\n";
        
        // Run build check
        echo "Step 2/2: Build Check\n";
        echo "=====================\n";
        $buildExitCode = 0;
        passthru("php " . __DIR__ . "/build.php", $buildExitCode);
        
        $overallSuccess = ($lintExitCode === 0 && $buildExitCode === 0);
        
        echo "\n";
        echo "🏁 Overall Result\n";
        echo "=================\n";
        if ($overallSuccess) {
            echo "✅ All checks passed! Your application is ready.\n";
        } else {
            echo "❌ Some checks failed. Please review the output above.\n";
        }
        
        exit($overallSuccess ? 0 : 1);
        
    case 'serve':
        echo "Starting development server on http://localhost:8000\n";
        echo "Press Ctrl+C to stop\n\n";
        $rootDir = dirname(__DIR__);
        passthru("cd " . escapeshellarg($rootDir) . " && php -S localhost:8000");
        break;
        
    case 'help':
    default:
        echo "PHP Marketing Analytics - Script Runner\n";
        echo "=======================================\n\n";
        echo "Available commands:\n\n";
        echo "  lint     - Check PHP syntax and common issues\n";
        echo "  build    - Verify deployment readiness\n";
        echo "  test     - Run both lint and build checks\n";
        echo "  serve    - Start development server on localhost:8000\n";
        echo "  help     - Show this help message\n\n";
        echo "Examples:\n";
        echo "  php scripts/run.php lint\n";
        echo "  php scripts/run.php test\n";
        echo "  php scripts/run.php serve\n";
        break;
}
?>
