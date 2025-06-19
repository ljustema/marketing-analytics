<?php
/**
 * PHP Linting and Error Checking Script
 * Similar to npm run lint for PHP projects
 */

class PHPLinter {
    private $errors = [];
    private $warnings = [];
    private $files = [];
    
    public function __construct() {
        $this->findPHPFiles();
    }
    
    private function findPHPFiles() {
        $directories = [
            __DIR__ . '/../',
            __DIR__ . '/../api/',
            __DIR__ . '/../includes/'
        ];
        
        foreach ($directories as $dir) {
            if (is_dir($dir)) {
                $files = glob($dir . '*.php');
                $this->files = array_merge($this->files, $files);
            }
        }
    }
    
    public function lint() {
        echo "🔍 PHP Linting and Error Check\n";
        echo "==============================\n\n";
        
        $this->checkSyntax();
        $this->checkIncludes();
        $this->checkBasicIssues();
        
        $this->printResults();
        
        return count($this->errors) === 0;
    }
    
    private function checkSyntax() {
        echo "📝 Checking PHP syntax...\n";
        
        foreach ($this->files as $file) {
            $output = [];
            $returnCode = 0;
            
            exec("php -l " . escapeshellarg($file) . " 2>&1", $output, $returnCode);
            
            if ($returnCode !== 0) {
                $this->errors[] = "Syntax error in {$file}: " . implode("\n", $output);
            } else {
                echo "  ✅ " . basename($file) . "\n";
            }
        }
        echo "\n";
    }
    
    private function checkIncludes() {
        echo "📂 Checking file includes...\n";
        
        foreach ($this->files as $file) {
            $content = file_get_contents($file);
            
            // Check for require/include statements
            preg_match_all('/(?:require|include)(?:_once)?\s*\(?[\'"]([^\'"]+)[\'"]/', $content, $matches);
            
            foreach ($matches[1] as $includePath) {
                // Skip URLs and absolute paths
                if (strpos($includePath, 'http') === 0 || strpos($includePath, '/') === 0) {
                    continue;
                }
                
                $fullPath = dirname($file) . '/' . $includePath;
                if (!file_exists($fullPath)) {
                    $this->errors[] = "Missing include in {$file}: {$includePath}";
                } else {
                    echo "  ✅ " . basename($file) . " -> " . basename($includePath) . "\n";
                }
            }
        }
        echo "\n";
    }
    
    private function checkBasicIssues() {
        echo "⚠️  Checking for common issues...\n";
        
        foreach ($this->files as $file) {
            $content = file_get_contents($file);
            $lines = explode("\n", $content);
            
            foreach ($lines as $lineNum => $line) {
                $lineNum++; // 1-based line numbers
                
                // Check for potential issues
                if (strpos($line, 'echo') !== false && strpos($line, 'json_encode') === false && strpos($line, 'header') === false) {
                    if (strpos($line, '<?php') === false && strpos($line, '//') === false && strpos($line, '*') === false) {
                        $this->warnings[] = "Potential debug output in {$file}:{$lineNum} - {$line}";
                    }
                }
                
                // Check for session_start() calls
                if (strpos($line, 'session_start()') !== false) {
                    $this->warnings[] = "session_start() found in {$file}:{$lineNum} - ensure no duplicates";
                }
            }
        }
        
        foreach ($this->warnings as $warning) {
            echo "  ⚠️  " . $warning . "\n";
        }
        echo "\n";
    }
    
    private function printResults() {
        echo "📊 Results\n";
        echo "==========\n";
        echo "Files checked: " . count($this->files) . "\n";
        echo "Errors: " . count($this->errors) . "\n";
        echo "Warnings: " . count($this->warnings) . "\n\n";
        
        if (count($this->errors) > 0) {
            echo "❌ ERRORS:\n";
            foreach ($this->errors as $error) {
                echo "  • " . $error . "\n";
            }
            echo "\n";
        }
        
        if (count($this->errors) === 0) {
            echo "✅ All checks passed!\n";
        } else {
            echo "❌ Please fix the errors above.\n";
        }
    }
}

// Run the linter
$linter = new PHPLinter();
$success = $linter->lint();

exit($success ? 0 : 1);
?>
