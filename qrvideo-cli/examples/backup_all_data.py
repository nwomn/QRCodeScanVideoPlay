#!/usr/bin/env python3
"""
Example: Export all data for backup
"""

from qrvideo_cli.api import QRVideoClient
from qrvideo_cli import batch
import sys
from datetime import datetime

# Configuration
API_URL = "https://mzfmedia.cn/api"
USERNAME = "admin"
PASSWORD = "Admin@123"

def main():
    # Create timestamp for backup
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Create client and login
    print("Logging in...")
    client = QRVideoClient(API_URL)

    if not client.login(USERNAME, PASSWORD):
        print("Login failed!")
        sys.exit(1)

    print(f"✓ Logged in as {client.username}\n")

    # Export videos
    print("Exporting videos...")
    videos_file = f"backup_videos_{timestamp}.csv"
    batch.export_videos_to_csv(client, videos_file)

    # Export QR codes
    print("\nExporting QR codes...")
    qrcodes_file = f"backup_qrcodes_{timestamp}.csv"
    batch.export_qrcodes_to_csv(client, qrcodes_file)

    # Download all QR images
    print("\nDownloading QR code images...")
    qr_dir = f"backup_qr_images_{timestamp}"
    batch.download_all_qr_images(client, output_dir=qr_dir)

    print("\n" + "=" * 60)
    print("Backup completed!")
    print(f"  Videos CSV: {videos_file}")
    print(f"  QR Codes CSV: {qrcodes_file}")
    print(f"  QR Images: {qr_dir}/")
    print("=" * 60)

if __name__ == '__main__':
    main()
