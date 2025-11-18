#!/usr/bin/env python3
"""
Example: Bulk upload videos and create QR codes for each
"""

from qrvideo_cli.api import QRVideoClient
from qrvideo_cli import batch
import sys

# Configuration
API_URL = "https://mzfmedia.cn/api"
USERNAME = "admin"
PASSWORD = "Admin@123"
VIDEOS_DIR = "/path/to/videos"  # Change this
QR_OUTPUT_DIR = "qr_codes"

def main():
    # Create client and login
    print("Logging in...")
    client = QRVideoClient(API_URL)

    if not client.login(USERNAME, PASSWORD):
        print("Login failed!")
        sys.exit(1)

    print(f"✓ Logged in as {client.username}\n")

    # Step 1: Bulk upload videos
    print("=" * 60)
    print("Step 1: Uploading videos...")
    print("=" * 60)

    upload_results = batch.bulk_upload_videos(
        client=client,
        directory=VIDEOS_DIR,
        file_pattern="*.mp4",
        recursive=False
    )

    if not upload_results['success']:
        print("\nNo videos uploaded successfully. Exiting.")
        sys.exit(1)

    # Step 2: Create QR codes for uploaded videos
    print("\n" + "=" * 60)
    print("Step 2: Creating QR codes for uploaded videos...")
    print("=" * 60)

    qr_count = 0
    for video in upload_results['success']:
        video_id = video['id']
        title = video['title']

        print(f"\nCreating QR code for: {title}")
        qr = client.create_qrcode(
            video_id=video_id,
            description=f"QR code for {title}",
            is_active=True
        )

        if qr:
            print(f"✓ QR Code: {qr['codeValue']}")

            # Download QR image
            img_path = f"{QR_OUTPUT_DIR}/qr-{qr['codeValue']}.png"
            if client.download_qrcode_image(qr['id'], img_path):
                print(f"  Image saved: {img_path}")

            qr_count += 1

    # Summary
    print("\n" + "=" * 60)
    print("Summary:")
    print(f"  Videos uploaded: {len(upload_results['success'])}")
    print(f"  QR codes created: {qr_count}")
    print("=" * 60)

    # Show stats
    print("\nCurrent system stats:")
    stats = client.get_stats_summary()
    if stats:
        print(f"  Total videos: {stats['videoCount']}")
        print(f"  Total QR codes: {stats['qrCodeCount']}")
        print(f"  Total scans: {stats['scanCount']}")
        print(f"  Total plays: {stats['playCount']}")

if __name__ == '__main__':
    import os
    os.makedirs(QR_OUTPUT_DIR, exist_ok=True)
    main()
