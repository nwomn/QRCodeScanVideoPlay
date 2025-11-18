#!/bin/bash
# Example shell script for common CLI operations

# Configuration
API_URL="https://mzfmedia.cn/api"
CLI="python3 -m qrvideo_cli.cli"

echo "QR Video CLI - Common Operations"
echo "================================"

# Login
echo -e "\n1. Logging in..."
$CLI --api-url "$API_URL" login admin Admin@123

# Show stats
echo -e "\n2. Current Statistics:"
$CLI stats

# List videos
echo -e "\n3. Recent Videos:"
$CLI videos list --size 5

# List QR codes
echo -e "\n4. Recent QR Codes:"
$CLI qrcodes list --size 5

# Export data
echo -e "\n5. Exporting data..."
$CLI videos export --output videos_export.csv
$CLI qrcodes export --output qrcodes_export.csv

echo -e "\n================================"
echo "Operations completed!"
echo "Files created:"
echo "  - videos_export.csv"
echo "  - qrcodes_export.csv"
