"""Batch operations for QR Video CLI"""

import csv
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from .api import QRVideoClient


def bulk_upload_videos(
    client: QRVideoClient,
    directory: str,
    file_pattern: str = "*.mp4",
    recursive: bool = False
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Upload all videos from a directory

    Args:
        client: QRVideoClient instance
        directory: Directory path containing videos
        file_pattern: File pattern to match (default: *.mp4)
        recursive: Whether to search recursively (default: False)

    Returns:
        Dictionary with 'success' and 'failed' lists
    """
    path = Path(directory)

    # Find video files
    if recursive:
        video_files = list(path.rglob(file_pattern))
    else:
        video_files = list(path.glob(file_pattern))

    print(f"Found {len(video_files)} video files")
    results = {"success": [], "failed": []}

    for idx, video_file in enumerate(video_files, 1):
        title = video_file.stem  # Filename without extension
        print(f"\n[{idx}/{len(video_files)}] Uploading {video_file.name}...")

        result = client.upload_video(
            title=title,
            file_path=str(video_file),
            description=f"Auto-uploaded from {directory}"
        )

        if result:
            print(f"✓ Uploaded: {result['title']} (ID: {result['id']})")
            results["success"].append({
                "file": video_file.name,
                "id": result['id'],
                "title": result['title']
            })
        else:
            print(f"✗ Failed: {video_file.name}")
            results["failed"].append(video_file.name)

    # Summary
    print(f"\n{'='*60}")
    print(f"Upload Summary:")
    print(f"  Success: {len(results['success'])}")
    print(f"  Failed: {len(results['failed'])}")

    if results['failed']:
        print(f"\nFailed files:")
        for filename in results['failed']:
            print(f"  - {filename}")

    return results


def bulk_create_qrcodes_from_csv(
    client: QRVideoClient,
    csv_file: str,
    download_images: bool = False,
    output_dir: str = "qr_images"
) -> Dict[str, List]:
    """
    Create multiple QR codes from CSV file

    CSV Format:
        video_id,description,is_active
        guid1,Description 1,true
        guid2,Description 2,false

    Args:
        client: QRVideoClient instance
        csv_file: Path to CSV file
        download_images: Whether to download QR code images (default: False)
        output_dir: Directory to save QR images (default: qr_images)

    Returns:
        Dictionary with 'success' and 'failed' lists
    """
    results = {"success": [], "failed": []}

    # Create output directory if needed
    if download_images:
        os.makedirs(output_dir, exist_ok=True)

    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

        print(f"Processing {len(rows)} QR codes...")

        for idx, row in enumerate(rows, 1):
            video_id = row['video_id']
            description = row.get('description', '')
            is_active = row.get('is_active', 'true').lower() in ('true', '1', 'yes')

            print(f"\n[{idx}/{len(rows)}] Creating QR for video {video_id}...")

            qr = client.create_qrcode(video_id, description, is_active)

            if qr:
                print(f"✓ Created: {qr['codeValue']} -> {qr['videoTitle']}")
                results["success"].append(qr)

                # Optionally download image
                if download_images:
                    img_filename = os.path.join(output_dir, f"qr-{qr['codeValue']}.png")
                    if client.download_qrcode_image(qr['id'], img_filename):
                        print(f"  Image saved: {img_filename}")
            else:
                print(f"✗ Failed for video {video_id}")
                results["failed"].append(row)

    print(f"\n{'='*60}")
    print(f"Bulk QR Creation Summary:")
    print(f"  Success: {len(results['success'])}")
    print(f"  Failed: {len(results['failed'])}")

    return results


def export_videos_to_csv(
    client: QRVideoClient,
    output_file: str = "videos_export.csv",
    search: Optional[str] = None
) -> Optional[str]:
    """
    Export all videos to CSV file

    Args:
        client: QRVideoClient instance
        output_file: Output CSV file path (default: videos_export.csv)
        search: Optional search filter

    Returns:
        Path to output file or None on error
    """
    all_videos = []
    page = 1
    page_size = 100

    print("Fetching videos...")
    while True:
        data = client.list_videos(page=page, page_size=page_size, search=search)

        if not data:
            print(f"✗ Failed to fetch page {page}")
            break

        all_videos.extend(data['items'])
        print(f"  Fetched page {page} ({len(data['items'])} videos)")

        # Check if we've fetched all
        if len(all_videos) >= data['totalCount']:
            break

        page += 1

    # Write to CSV
    if all_videos:
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = [
                'id', 'title', 'description', 'filePath', 'coverPath',
                'duration', 'contentType', 'fileSize', 'isActive', 'createdAt'
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_videos)

        print(f"✓ Exported {len(all_videos)} videos to {output_file}")
        return output_file
    else:
        print("✗ No videos to export")
        return None


def export_qrcodes_to_csv(
    client: QRVideoClient,
    output_file: str = "qrcodes_export.csv",
    video_id: Optional[str] = None
) -> Optional[str]:
    """
    Export all QR codes to CSV file

    Args:
        client: QRVideoClient instance
        output_file: Output CSV file path (default: qrcodes_export.csv)
        video_id: Optional video ID filter

    Returns:
        Path to output file or None on error
    """
    all_qrcodes = []
    page = 1
    page_size = 100

    print("Fetching QR codes...")
    while True:
        data = client.list_qrcodes(page=page, page_size=page_size, video_id=video_id)

        if not data:
            print(f"✗ Failed to fetch page {page}")
            break

        all_qrcodes.extend(data['items'])
        print(f"  Fetched page {page} ({len(data['items'])} QR codes)")

        # Check if we've fetched all
        if len(all_qrcodes) >= data['totalCount']:
            break

        page += 1

    # Write to CSV
    if all_qrcodes:
        with open(output_file, 'w', newline='', encoding='utf-8') as f:
            fieldnames = [
                'id', 'codeValue', 'videoId', 'videoTitle',
                'isActive', 'createdAt', 'description'
            ]
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(all_qrcodes)

        print(f"✓ Exported {len(all_qrcodes)} QR codes to {output_file}")
        return output_file
    else:
        print("✗ No QR codes to export")
        return None


def download_all_qr_images(
    client: QRVideoClient,
    output_dir: str = "qr_images",
    video_id: Optional[str] = None
) -> Dict[str, int]:
    """
    Download all QR code images

    Args:
        client: QRVideoClient instance
        output_dir: Output directory for images (default: qr_images)
        video_id: Optional filter by video ID

    Returns:
        Dictionary with success and failed counts
    """
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Get all QR codes
    all_qrcodes = []
    page = 1
    page_size = 100

    print("Fetching QR codes...")
    while True:
        data = client.list_qrcodes(page=page, page_size=page_size, video_id=video_id)
        if not data:
            break

        all_qrcodes.extend(data['items'])
        if len(all_qrcodes) >= data['totalCount']:
            break
        page += 1

    print(f"Downloading {len(all_qrcodes)} QR code images...")

    success = 0
    failed = 0

    for idx, qr in enumerate(all_qrcodes, 1):
        output_path = os.path.join(output_dir, f"qr-{qr['codeValue']}.png")
        print(f"[{idx}/{len(all_qrcodes)}] {qr['codeValue']}... ", end="")

        if client.download_qrcode_image(qr['id'], output_path):
            print("✓")
            success += 1
        else:
            print("✗")
            failed += 1

    print(f"\n{'='*60}")
    print(f"Download Summary:")
    print(f"  Success: {success}")
    print(f"  Failed: {failed}")

    return {"success": success, "failed": failed}
