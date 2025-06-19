<?php
/**
 * PHP Build and Deployment Readiness Check
 * Similar to npm run build for PHP projects
 */

class PHPBuilder {
    private $errors = [];
    private $warnings = [];
    private $checks = [];
    
    public function build() {
        echo "🔨 PHP Build and Deployment Check\n";
        echo "==================================\n\n";
        
        $this->checkDirectoryStructure();
        $this->checkRequiredFiles();
        $this->checkPermissions();
        $this->checkConfiguration();
        $this->checkDependencies();
        
        $this->printResults();
        
        return count($this->errors) === 0;
    }
    
    private function checkDirectoryStructure() {
        echo "📁 Checking directory structure...\n";
        
        $requiredDirs = [
            'api',
            'includes', 
            'templates',
            'src',
            'analytics',
            'data',
            'users'
        ];
        
        foreach ($requiredDirs as $dir) {
            if (is_dir(__DIR__ . '/../' . $dir)) {
                echo "  ✅ {$dir}/\n";
                $this->checks[] = "Directory {$dir} exists";
            } else {
                $this->errors[] = "Missing required directory: {$dir}";
            }
        }
        echo "\n";
    }
    
    private function checkRequiredFiles() {
        echo "📄 Checking required files...\n";
        
        $requiredFiles = [
            'index.php' => 'Main entry point',
            'api/auth.php' => 'Authentication API',
            'api/data.php' => 'Data API',
            'api/thresholds.php' => 'Thresholds API',
            'includes/Auth.php' => 'Auth class',
            'templates/index.html' => 'Main template',
            'templates/login.html' => 'Login template',
            'src/script.js' => 'Main JavaScript',
            'src/styles.css' => 'Main styles',
            'railway.json' => 'Railway config',
            'nixpacks.toml' => 'Build config'
        ];
        
        foreach ($requiredFiles as $file => $description) {
            $fullPath = __DIR__ . '/../' . $file;
            if (file_exists($fullPath)) {
                echo "  ✅ {$file} ({$description})\n";
                $this->checks[] = "File {$file} exists";
            } else {
                $this->errors[] = "Missing required file: {$file} ({$description})";
            }
        }
        echo "\n";
    }
    
    private function checkPermissions() {
        echo "🔒 Checking permissions...\n";
        
        $writableDirs = ['data', 'users'];
        
        foreach ($writableDirs as $dir) {
            $fullPath = __DIR__ . '/../' . $dir;
            if (is_dir($fullPath)) {
                if (is_writable($fullPath)) {
                    echo "  ✅ {$dir}/ is writable\n";
                    $this->checks[] = "Directory {$dir} is writable";
                } else {
                    $this->warnings[] = "Directory {$dir} may not be writable";
                }
            }
        }
        echo "\n";
    }
    
    private function checkConfiguration() {
        echo "⚙️  Checking configuration files...\n";
        
        // Check railway.json
        $railwayConfig = __DIR__ . '/../railway.json';
        if (file_exists($railwayConfig)) {
            $config = json_decode(file_get_contents($railwayConfig), true);
            if ($config && isset($config['deploy']['startCommand'])) {
                echo "  ✅ railway.json is valid\n";
                $this->checks[] = "Railway config is valid";
            } else {
                $this->errors[] = "Invalid railway.json configuration";
            }
        }
        
        // Check nixpacks.toml
        $nixpacksConfig = __DIR__ . '/../nixpacks.toml';
        if (file_exists($nixpacksConfig)) {
            $content = file_get_contents($nixpacksConfig);
            if (strpos($content, 'php82') !== false) {
                echo "  ✅ nixpacks.toml has PHP configuration\n";
                $this->checks[] = "Nixpacks config is valid";
            } else {
                $this->warnings[] = "nixpacks.toml may be missing PHP configuration";
            }
        }
        echo "\n";
    }
    
    private function checkDependencies() {
        echo "📦 Checking PHP dependencies...\n";
        
        $requiredExtensions = ['json', 'session'];
        
        foreach ($requiredExtensions as $ext) {
            if (extension_loaded($ext)) {
                echo "  ✅ PHP {$ext} extension loaded\n";
                $this->checks[] = "PHP {$ext} extension available";
            } else {
                $this->errors[] = "Missing PHP extension: {$ext}";
            }
        }
        
        // Check PHP version
        $phpVersion = PHP_VERSION;
        if (version_compare($phpVersion, '7.4.0', '>=')) {
            echo "  ✅ PHP version {$phpVersion} is compatible\n";
            $this->checks[] = "PHP version is compatible";
        } else {
            $this->errors[] = "PHP version {$phpVersion} is too old (requires 7.4+)";
        }
        echo "\n";
    }
    
    private function printResults() {
        echo "📊 Build Results\n";
        echo "================\n";
        echo "Checks passed: " . count($this->checks) . "\n";
        echo "Errors: " . count($this->errors) . "\n";
        echo "Warnings: " . count($this->warnings) . "\n\n";
        
        if (count($this->errors) > 0) {
            echo "❌ BUILD ERRORS:\n";
            foreach ($this->errors as $error) {
                echo "  • " . $error . "\n";
            }
            echo "\n";
        }
        
        if (count($this->warnings) > 0) {
            echo "⚠️  BUILD WARNINGS:\n";
            foreach ($this->warnings as $warning) {
                echo "  • " . $warning . "\n";
            }
            echo "\n";
        }
        
        if (count($this->errors) === 0) {
            echo "✅ Build successful! Ready for deployment.\n";
        } else {
            echo "❌ Build failed. Please fix the errors above.\n";
        }
    }
}

// Run the builder
$builder = new PHPBuilder();
$success = $builder->build();

exit($success ? 0 : 1);
?>
