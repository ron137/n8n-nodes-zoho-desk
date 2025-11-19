#!/bin/bash

echo "Publishing n8n Zoho Desk node under @enthu organization"
echo "======================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if logged in to npm
echo "Checking npm login status..."
npm whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You need to login to npm first${NC}"
    echo "Please run: npm login"
    echo ""
    echo "Make sure you're logged in with an account that has access to @enthu organization"
    exit 1
fi

CURRENT_USER=$(npm whoami)
echo -e "${GREEN}✓ Logged in as: $CURRENT_USER${NC}"
echo ""

# Check if user has access to @enthu org
echo "Checking @enthu organization access..."
npm org ls @enthu $CURRENT_USER &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Warning: Cannot verify @enthu organization membership${NC}"
    echo "Make sure your npm account has access to publish under @enthu"
    echo ""
    read -p "Do you want to continue anyway? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✓ Access to @enthu organization confirmed${NC}"
fi
echo ""

# Build the project
echo "Building the project..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo -e "${RED}✗ dist folder not found${NC}"
    exit 1
fi

# Check version
PACKAGE_VERSION=$(node -p "require('./package.json').version")
PACKAGE_NAME=$(node -p "require('./package.json').name")
echo "Package: $PACKAGE_NAME"
echo "Version: $PACKAGE_VERSION"
echo ""

# Check if version already exists
npm view $PACKAGE_NAME@$PACKAGE_VERSION version &> /dev/null
if [ $? -eq 0 ]; then
    echo -e "${YELLOW}Warning: Version $PACKAGE_VERSION already exists${NC}"
    echo "Please update the version in package.json"
    echo "Current version: $PACKAGE_VERSION"
    echo ""
    echo "You can update it by running:"
    echo "  npm version patch  # for bug fixes (0.1.0 -> 0.1.1)"
    echo "  npm version minor  # for new features (0.1.0 -> 0.2.0)"
    echo "  npm version major  # for breaking changes (0.1.0 -> 1.0.0)"
    exit 1
fi

# Dry run first
echo "Running dry-run to verify package..."
npm publish --dry-run
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Dry run failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dry run successful${NC}"
echo ""

# Ask for confirmation
echo -e "${YELLOW}Ready to publish $PACKAGE_NAME@$PACKAGE_VERSION${NC}"
read -p "Do you want to publish to npm? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Publishing to npm..."
    npm publish --access public
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✓ Successfully published $PACKAGE_NAME@$PACKAGE_VERSION${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Users can now install with: npm install $PACKAGE_NAME"
        echo "2. In n8n UI: Settings -> Community Nodes -> Search for '$PACKAGE_NAME'"
        echo "3. Create a GitHub release with tag v$PACKAGE_VERSION"
        echo ""
        echo "View your package at: https://www.npmjs.com/package/$PACKAGE_NAME"
    else
        echo -e "${RED}✗ Publishing failed${NC}"
        exit 1
    fi
else
    echo "Publishing cancelled"
fi
