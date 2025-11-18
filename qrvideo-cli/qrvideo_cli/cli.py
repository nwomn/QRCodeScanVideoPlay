#!/usr/bin/env python3
"""
QR Video CLI - Command-line tool for QR Video System management

Usage:
    qrvideo login <username> <password>
    qrvideo videos list [--page PAGE] [--size SIZE] [--search TERM]
    qrvideo videos upload <title> <file> [--description DESC]
    qrvideo videos bulk-upload <directory> [--pattern PATTERN] [--recursive]
    qrvideo videos export [--output FILE] [--search TERM]
    qrvideo videos delete <video_id>
    qrvideo qrcodes list [--page PAGE] [--size SIZE] [--video-id ID]
    qrvideo qrcodes create <video_id> [--description DESC] [--inactive]
    qrvideo qrcodes bulk-create <csv_file> [--download-images] [--output-dir DIR]
    qrvideo qrcodes export [--output FILE] [--video-id ID]
    qrvideo qrcodes download-all [--output-dir DIR] [--video-id ID]
    qrvideo qrcodes delete <qrcode_id>
    qrvideo stats
    qrvideo logs scans [--page PAGE] [--size SIZE] [--qrcode-id ID]
    qrvideo logs plays [--page PAGE] [--size SIZE] [--video-id ID]
"""

import sys
import argparse
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from qrvideo_cli.api import QRVideoClient
from qrvideo_cli import batch


# Configuration
DEFAULT_API_URL = os.environ.get('QRVIDEO_API_URL', 'https://mzfmedia.cn/api')
CONFIG_FILE = Path.home() / '.qrvideo_cli' / 'config'


def save_credentials(username: str, token: str):
    """Save credentials to config file"""
    config_dir = CONFIG_FILE.parent
    config_dir.mkdir(exist_ok=True)

    with open(CONFIG_FILE, 'w') as f:
        f.write(f"username={username}\n")
        f.write(f"token={token}\n")

    # Set restrictive permissions
    os.chmod(CONFIG_FILE, 0o600)


def load_credentials():
    """Load saved credentials"""
    if not CONFIG_FILE.exists():
        return None, None

    username, token = None, None
    with open(CONFIG_FILE, 'r') as f:
        for line in f:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                if key == 'username':
                    username = value
                elif key == 'token':
                    token = value

    return username, token


def get_client(api_url: str = DEFAULT_API_URL, require_auth: bool = True):
    """Get API client with authentication"""
    client = QRVideoClient(api_url)

    if require_auth:
        # Try to load saved credentials
        username, token = load_credentials()
        if username and token:
            client.username = username
            client.token = token
            print(f"Using saved credentials for {username}")
        else:
            print("Not authenticated. Please run: qrvideo login <username> <password>")
            sys.exit(1)

    return client


def cmd_login(args):
    """Handle login command"""
    client = QRVideoClient(args.api_url)

    if client.login(args.username, args.password):
        print(f"✓ Logged in successfully as {client.username}")
        print(f"  Token expires: {client.token_expires}")

        # Save credentials
        save_credentials(client.username, client.token)
        print(f"  Credentials saved to {CONFIG_FILE}")
    else:
        print("✗ Login failed")
        sys.exit(1)


def cmd_videos_list(args):
    """List videos"""
    client = get_client(args.api_url)

    data = client.list_videos(
        page=args.page,
        page_size=args.size,
        search=args.search
    )

    if data:
        total_pages = (data['totalCount'] - 1) // data['pageSize'] + 1
        print(f"Videos (Page {data['page']}/{total_pages}):")
        print(f"Total: {data['totalCount']}\n")

        for video in data['items']:
            file_size_mb = video.get('fileSize', 0) / 1024 / 1024 if video.get('fileSize') else 0
            active_str = "✓" if video['isActive'] else "✗"

            print(f"{active_str} [{video['id']}]")
            print(f"  Title: {video['title']}")
            if video.get('description'):
                print(f"  Description: {video['description']}")
            print(f"  Size: {file_size_mb:.2f} MB")
            print(f"  Created: {video['createdAt']}")
            print()


def cmd_videos_upload(args):
    """Upload a video"""
    client = get_client(args.api_url)

    if not os.path.exists(args.file):
        print(f"✗ File not found: {args.file}")
        sys.exit(1)

    result = client.upload_video(
        title=args.title,
        file_path=args.file,
        description=args.description
    )

    if result:
        print(f"✓ Video uploaded successfully!")
        print(f"  ID: {result['id']}")
        print(f"  Title: {result['title']}")
        print(f"  Path: {result['filePath']}")
    else:
        sys.exit(1)


def cmd_videos_bulk_upload(args):
    """Bulk upload videos"""
    client = get_client(args.api_url)

    if not os.path.exists(args.directory):
        print(f"✗ Directory not found: {args.directory}")
        sys.exit(1)

    batch.bulk_upload_videos(
        client=client,
        directory=args.directory,
        file_pattern=args.pattern,
        recursive=args.recursive
    )


def cmd_videos_export(args):
    """Export videos to CSV"""
    client = get_client(args.api_url)

    batch.export_videos_to_csv(
        client=client,
        output_file=args.output,
        search=args.search
    )


def cmd_videos_delete(args):
    """Delete a video"""
    client = get_client(args.api_url)

    if client.delete_video(args.video_id):
        print(f"✓ Video deleted: {args.video_id}")
    else:
        print(f"✗ Failed to delete video")
        sys.exit(1)


def cmd_qrcodes_list(args):
    """List QR codes"""
    client = get_client(args.api_url)

    data = client.list_qrcodes(
        page=args.page,
        page_size=args.size,
        video_id=args.video_id
    )

    if data:
        total_pages = (data['totalCount'] - 1) // data['pageSize'] + 1
        print(f"QR Codes (Page {data['page']}/{total_pages}):")
        print(f"Total: {data['totalCount']}\n")

        for qr in data['items']:
            active_str = "✓" if qr['isActive'] else "✗"

            print(f"{active_str} {qr['codeValue']}")
            print(f"  ID: {qr['id']}")
            print(f"  Video: {qr['videoTitle']} ({qr['videoId']})")
            if qr.get('description'):
                print(f"  Description: {qr['description']}")
            print(f"  Created: {qr['createdAt']}")
            print()


def cmd_qrcodes_create(args):
    """Create a QR code"""
    client = get_client(args.api_url)

    result = client.create_qrcode(
        video_id=args.video_id,
        description=args.description,
        is_active=not args.inactive
    )

    if result:
        print(f"✓ QR Code created!")
        print(f"  ID: {result['id']}")
        print(f"  Code: {result['codeValue']}")
        print(f"  Video: {result['videoTitle']}")
    else:
        sys.exit(1)


def cmd_qrcodes_bulk_create(args):
    """Bulk create QR codes from CSV"""
    client = get_client(args.api_url)

    if not os.path.exists(args.csv_file):
        print(f"✗ CSV file not found: {args.csv_file}")
        sys.exit(1)

    batch.bulk_create_qrcodes_from_csv(
        client=client,
        csv_file=args.csv_file,
        download_images=args.download_images,
        output_dir=args.output_dir
    )


def cmd_qrcodes_export(args):
    """Export QR codes to CSV"""
    client = get_client(args.api_url)

    batch.export_qrcodes_to_csv(
        client=client,
        output_file=args.output,
        video_id=args.video_id
    )


def cmd_qrcodes_download_all(args):
    """Download all QR code images"""
    client = get_client(args.api_url)

    batch.download_all_qr_images(
        client=client,
        output_dir=args.output_dir,
        video_id=args.video_id
    )


def cmd_qrcodes_delete(args):
    """Delete a QR code"""
    client = get_client(args.api_url)

    if client.delete_qrcode(args.qrcode_id):
        print(f"✓ QR code deleted: {args.qrcode_id}")
    else:
        print(f"✗ Failed to delete QR code")
        sys.exit(1)


def cmd_stats(args):
    """Show statistics"""
    client = get_client(args.api_url)

    stats = client.get_stats_summary()

    if stats:
        print("Dashboard Summary:")
        print(f"  Videos: {stats['videoCount']}")
        print(f"  QR Codes: {stats['qrCodeCount']}")
        print(f"  Total Scans: {stats['scanCount']}")
        print(f"  Total Plays: {stats['playCount']}")


def cmd_logs_scans(args):
    """View scan logs"""
    client = get_client(args.api_url)

    data = client.list_scan_logs(
        page=args.page,
        page_size=args.size,
        qrcode_id=args.qrcode_id
    )

    if data:
        total_pages = (data['totalCount'] - 1) // data['pageSize'] + 1
        print(f"Scan Logs (Page {data['page']}/{total_pages}):")
        print(f"Total: {data['totalCount']}\n")

        for log in data['items']:
            status = "✓" if log['success'] else "✗"
            print(f"{status} {log['timestamp']}")
            print(f"  Code: {log['codeValue']}")
            print(f"  Client: {log.get('clientInfo', 'Unknown')}")
            if not log['success']:
                print(f"  Reason: {log.get('failReason', 'Unknown')}")
            print()


def cmd_logs_plays(args):
    """View play logs"""
    client = get_client(args.api_url)

    data = client.list_play_logs(
        page=args.page,
        page_size=args.size,
        video_id=args.video_id
    )

    if data:
        total_pages = (data['totalCount'] - 1) // data['pageSize'] + 1
        print(f"Play Logs (Page {data['page']}/{total_pages}):")
        print(f"Total: {data['totalCount']}\n")

        for log in data['items']:
            completed_str = "✓" if log['completed'] else "◐"
            print(f"{completed_str} {log['timestamp']}")
            print(f"  Video: {log['videoTitle']}")
            if log.get('watchedDuration'):
                print(f"  Watched: {log['watchedDuration']}")
            print(f"  Client: {log.get('clientInfo', 'Unknown')}")
            print()


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description='QR Video CLI - Manage QR Video System via API',
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument('--api-url', default=DEFAULT_API_URL, help='API base URL')

    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # Login command
    login_parser = subparsers.add_parser('login', help='Login to API')
    login_parser.add_argument('username', help='Username')
    login_parser.add_argument('password', help='Password')
    login_parser.set_defaults(func=cmd_login)

    # Videos commands
    videos_parser = subparsers.add_parser('videos', help='Video management')
    videos_sub = videos_parser.add_subparsers(dest='videos_command')

    # videos list
    vlist = videos_sub.add_parser('list', help='List videos')
    vlist.add_argument('--page', type=int, default=1)
    vlist.add_argument('--size', type=int, default=20)
    vlist.add_argument('--search', help='Search term')
    vlist.set_defaults(func=cmd_videos_list)

    # videos upload
    vupload = videos_sub.add_parser('upload', help='Upload a video')
    vupload.add_argument('title', help='Video title')
    vupload.add_argument('file', help='Video file path')
    vupload.add_argument('--description', help='Video description')
    vupload.set_defaults(func=cmd_videos_upload)

    # videos bulk-upload
    vbulk = videos_sub.add_parser('bulk-upload', help='Bulk upload videos')
    vbulk.add_argument('directory', help='Directory containing videos')
    vbulk.add_argument('--pattern', default='*.mp4', help='File pattern (default: *.mp4)')
    vbulk.add_argument('--recursive', action='store_true', help='Search recursively')
    vbulk.set_defaults(func=cmd_videos_bulk_upload)

    # videos export
    vexport = videos_sub.add_parser('export', help='Export videos to CSV')
    vexport.add_argument('--output', default='videos_export.csv', help='Output file')
    vexport.add_argument('--search', help='Filter by search term')
    vexport.set_defaults(func=cmd_videos_export)

    # videos delete
    vdelete = videos_sub.add_parser('delete', help='Delete a video')
    vdelete.add_argument('video_id', help='Video GUID')
    vdelete.set_defaults(func=cmd_videos_delete)

    # QR codes commands
    qr_parser = subparsers.add_parser('qrcodes', help='QR code management')
    qr_sub = qr_parser.add_subparsers(dest='qrcodes_command')

    # qrcodes list
    qlist = qr_sub.add_parser('list', help='List QR codes')
    qlist.add_argument('--page', type=int, default=1)
    qlist.add_argument('--size', type=int, default=20)
    qlist.add_argument('--video-id', help='Filter by video ID')
    qlist.set_defaults(func=cmd_qrcodes_list)

    # qrcodes create
    qcreate = qr_sub.add_parser('create', help='Create a QR code')
    qcreate.add_argument('video_id', help='Video GUID')
    qcreate.add_argument('--description', help='QR code description')
    qcreate.add_argument('--inactive', action='store_true', help='Create as inactive')
    qcreate.set_defaults(func=cmd_qrcodes_create)

    # qrcodes bulk-create
    qbulk = qr_sub.add_parser('bulk-create', help='Bulk create QR codes from CSV')
    qbulk.add_argument('csv_file', help='CSV file path')
    qbulk.add_argument('--download-images', action='store_true', help='Download QR images')
    qbulk.add_argument('--output-dir', default='qr_images', help='Output directory for images')
    qbulk.set_defaults(func=cmd_qrcodes_bulk_create)

    # qrcodes export
    qexport = qr_sub.add_parser('export', help='Export QR codes to CSV')
    qexport.add_argument('--output', default='qrcodes_export.csv', help='Output file')
    qexport.add_argument('--video-id', help='Filter by video ID')
    qexport.set_defaults(func=cmd_qrcodes_export)

    # qrcodes download-all
    qdownload = qr_sub.add_parser('download-all', help='Download all QR code images')
    qdownload.add_argument('--output-dir', default='qr_images', help='Output directory')
    qdownload.add_argument('--video-id', help='Filter by video ID')
    qdownload.set_defaults(func=cmd_qrcodes_download_all)

    # qrcodes delete
    qdelete = qr_sub.add_parser('delete', help='Delete a QR code')
    qdelete.add_argument('qrcode_id', help='QR code GUID')
    qdelete.set_defaults(func=cmd_qrcodes_delete)

    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show statistics')
    stats_parser.set_defaults(func=cmd_stats)

    # Logs commands
    logs_parser = subparsers.add_parser('logs', help='View logs')
    logs_sub = logs_parser.add_subparsers(dest='logs_command')

    # logs scans
    lscans = logs_sub.add_parser('scans', help='View scan logs')
    lscans.add_argument('--page', type=int, default=1)
    lscans.add_argument('--size', type=int, default=20)
    lscans.add_argument('--qrcode-id', help='Filter by QR code ID')
    lscans.set_defaults(func=cmd_logs_scans)

    # logs plays
    lplays = logs_sub.add_parser('plays', help='View play logs')
    lplays.add_argument('--page', type=int, default=1)
    lplays.add_argument('--size', type=int, default=20)
    lplays.add_argument('--video-id', help='Filter by video ID')
    lplays.set_defaults(func=cmd_logs_plays)

    # Parse arguments
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    # Execute command
    if hasattr(args, 'func'):
        args.func(args)
    else:
        parser.print_help()
        sys.exit(1)


if __name__ == '__main__':
    main()
