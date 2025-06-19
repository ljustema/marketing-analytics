# Marketing Analytics - PHP Project Makefile
# Similar to npm scripts for PHP projects

.PHONY: help lint build test serve clean install

# Default target
help:
	@echo "Marketing Analytics - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "  make lint     - Run PHP linting and error checks"
	@echo "  make build    - Run build and deployment readiness check"
	@echo "  make test     - Run all checks (lint + build)"
	@echo "  make serve    - Start development server"
	@echo "  make clean    - Clean temporary files"
	@echo "  make install  - Set up project (create directories, permissions)"
	@echo "  make help     - Show this help message"
	@echo ""

# Run PHP linter
lint:
	@php scripts/run.php lint

# Run build check
build:
	@php scripts/run.php build

# Run all tests
test:
	@php scripts/run.php test

# Start development server
serve:
	@php scripts/run.php serve

# Clean temporary files
clean:
	@echo "🧹 Cleaning temporary files..."
	@find . -name "*.tmp" -delete 2>/dev/null || true
	@find . -name "*.log" -delete 2>/dev/null || true
	@echo "✅ Cleanup complete"

# Install/setup project
install:
	@echo "📦 Setting up Marketing Analytics project..."
	@mkdir -p data users src templates api analytics includes scripts
	@chmod 755 data users src templates api analytics includes scripts 2>/dev/null || true
	@echo "✅ Project setup complete"
	@echo ""
	@echo "Next steps:"
	@echo "  make test    - Run all checks"
	@echo "  make serve   - Start development server"
