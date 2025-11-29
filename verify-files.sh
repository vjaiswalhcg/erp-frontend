#!/bin/bash

echo "=========================================="
echo "Verifying Frontend Files"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found!"
    echo "Make sure you're in the frontend directory"
    exit 1
fi

echo "✅ package.json found"

# Check for required files
files=(
    "next.config.js"
    "tsconfig.json"
    "tailwind.config.ts"
    "postcss.config.js"
    ".eslintrc.json"
    "app/layout.tsx"
    "app/page.tsx"
    "app/globals.css"
    "lib/utils.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ MISSING: $file"
    fi
done

# Check directories
dirs=(
    "app"
    "components"
    "lib"
    "hooks"
)

echo ""
echo "Checking directories..."
for dir in "${dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ $dir/"
    else
        echo "❌ MISSING: $dir/"
    fi
done

echo ""
echo "=========================================="
echo "File Structure:"
echo "=========================================="
tree -L 2 -I 'node_modules' || find . -maxdepth 2 -not -path '*/node_modules/*' -not -path '*/.next/*'

echo ""
echo "=========================================="
echo "Checking package.json scripts..."
echo "=========================================="
if grep -q '"build"' package.json; then
    echo "✅ build script found"
else
    echo "❌ build script missing!"
fi

if grep -q '"start"' package.json; then
    echo "✅ start script found"
else
    echo "❌ start script missing!"
fi

echo ""
echo "Verification complete!"
