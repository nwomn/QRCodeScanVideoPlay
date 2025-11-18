"""API client for QR Video System"""

import requests
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path


class QRVideoClient:
    """Main API client for QR Video System"""

    def __init__(self, base_url: str = "https://mzfmedia.cn/api"):
        """
        Initialize the API client

        Args:
            base_url: Base URL of the API (default: https://mzfmedia.cn/api)
        """
        self.base_url = base_url.rstrip('/')
        self.token: Optional[str] = None
        self.token_expires: Optional[datetime] = None
        self.username: Optional[str] = None

    def login(self, username: str, password: str) -> bool:
        """
        Authenticate and store JWT token

        Args:
            username: Username
            password: Password

        Returns:
            True if login successful, False otherwise
        """
        try:
            response = requests.post(
                f"{self.base_url}/auth/login",
                json={"username": username, "password": password},
                timeout=10
            )

            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                self.username = data["username"]

                # Parse expiry time
                expires_str = data["expiresAt"]
                if expires_str.endswith('Z'):
                    expires_str = expires_str[:-1] + '+00:00'
                self.token_expires = datetime.fromisoformat(expires_str)

                return True
            else:
                print(f"Login failed: {response.status_code}")
                if response.text:
                    print(f"Error: {response.text}")
                return False

        except Exception as e:
            print(f"Login error: {e}")
            return False

    def _get_headers(self, include_auth: bool = True) -> Dict[str, str]:
        """
        Get headers for API requests

        Args:
            include_auth: Whether to include authorization header

        Returns:
            Dictionary of headers

        Raises:
            Exception: If not authenticated or token expired
        """
        headers = {}

        if include_auth:
            if not self.token:
                raise Exception("Not authenticated. Call login() first.")

            if self.token_expires and datetime.now() >= self.token_expires.replace(tzinfo=None):
                raise Exception("Token expired. Please login again.")

            headers["Authorization"] = f"Bearer {self.token}"

        return headers

    def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        files: Optional[Dict[str, Any]] = None,
        require_auth: bool = True,
        timeout: int = 30
    ) -> requests.Response:
        """
        Make an API request

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint path
            params: Query parameters
            data: Request body data
            files: Files for multipart upload
            require_auth: Whether authentication is required
            timeout: Request timeout in seconds

        Returns:
            Response object
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = self._get_headers(include_auth=require_auth)

        # Add Content-Type for JSON requests (unless uploading files)
        if data and not files:
            headers["Content-Type"] = "application/json"
            data = json.dumps(data) if isinstance(data, dict) else data

        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            params=params,
            data=data,
            files=files,
            timeout=timeout
        )

        return response

    # Video operations

    def list_videos(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        List videos with pagination and optional search

        Args:
            page: Page number (default: 1)
            page_size: Number of items per page (default: 20)
            search: Search term for title/description

        Returns:
            Dictionary with 'items', 'page', 'pageSize', 'totalCount' or None on error
        """
        params = {"page": page, "pageSize": page_size}
        if search:
            params["search"] = search

        try:
            response = self._make_request("GET", "/videos", params=params)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to list videos: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error listing videos: {e}")
            return None

    def get_video(self, video_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific video by ID

        Args:
            video_id: Video GUID

        Returns:
            Video data dictionary or None on error
        """
        try:
            response = self._make_request("GET", f"/videos/{video_id}")
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to get video: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error getting video: {e}")
            return None

    def upload_video(
        self,
        title: str,
        file_path: str,
        description: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Upload a video file

        Args:
            title: Video title
            file_path: Path to video file
            description: Optional video description

        Returns:
            Uploaded video data or None on error
        """
        try:
            # Prepare multipart form data
            with open(file_path, 'rb') as f:
                files = {'File': f}
                data = {'Title': title}
                if description:
                    data['Description'] = description

                # Don't include Content-Type in headers for multipart
                response = self._make_request(
                    "POST",
                    "/videos",
                    data=data,
                    files=files,
                    timeout=1800  # 30 minutes for large files
                )

            if response.status_code == 201:
                return response.json()
            else:
                print(f"Upload failed: {response.status_code}")
                if response.text:
                    print(f"Error: {response.text}")
                return None

        except Exception as e:
            print(f"Error uploading video: {e}")
            return None

    def update_video(
        self,
        video_id: str,
        title: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Update video metadata

        Args:
            video_id: Video GUID
            title: New title (optional)
            description: New description (optional)
            is_active: Active status (optional)

        Returns:
            Updated video data or None on error
        """
        # Get current video first
        current = self.get_video(video_id)
        if not current:
            return None

        # Build update payload
        payload = {
            "title": title if title is not None else current.get("title"),
            "description": description if description is not None else current.get("description"),
            "isActive": is_active if is_active is not None else current.get("isActive", True)
        }

        try:
            response = self._make_request("PUT", f"/videos/{video_id}", data=payload)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to update video: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error updating video: {e}")
            return None

    def delete_video(self, video_id: str) -> bool:
        """
        Delete a video

        Args:
            video_id: Video GUID

        Returns:
            True if successful, False otherwise
        """
        try:
            response = self._make_request("DELETE", f"/videos/{video_id}")
            if response.status_code == 204:
                return True
            else:
                print(f"Failed to delete video: {response.status_code}")
                return False
        except Exception as e:
            print(f"Error deleting video: {e}")
            return False

    # QR Code operations

    def list_qrcodes(
        self,
        page: int = 1,
        page_size: int = 20,
        video_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        List QR codes with pagination and optional filtering

        Args:
            page: Page number (default: 1)
            page_size: Number of items per page (default: 20)
            video_id: Filter by video GUID

        Returns:
            Dictionary with 'items', 'page', 'pageSize', 'totalCount' or None on error
        """
        params = {"page": page, "pageSize": page_size}
        if video_id:
            params["videoId"] = video_id

        try:
            response = self._make_request("GET", "/qrcodes", params=params)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to list QR codes: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error listing QR codes: {e}")
            return None

    def get_qrcode(self, qrcode_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific QR code by ID

        Args:
            qrcode_id: QR code GUID

        Returns:
            QR code data dictionary or None on error
        """
        try:
            response = self._make_request("GET", f"/qrcodes/{qrcode_id}")
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to get QR code: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error getting QR code: {e}")
            return None

    def create_qrcode(
        self,
        video_id: str,
        description: Optional[str] = None,
        is_active: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Create a QR code for a video

        Args:
            video_id: Video GUID
            description: Optional description
            is_active: Whether the QR code is active (default: True)

        Returns:
            Created QR code data or None on error
        """
        payload = {
            "videoId": video_id,
            "description": description,
            "isActive": is_active
        }

        try:
            response = self._make_request("POST", "/qrcodes", data=payload)
            if response.status_code == 201:
                return response.json()
            else:
                print(f"Failed to create QR code: {response.status_code}")
                if response.text:
                    print(f"Error: {response.text}")
                return None
        except Exception as e:
            print(f"Error creating QR code: {e}")
            return None

    def update_qrcode(
        self,
        qrcode_id: str,
        video_id: Optional[str] = None,
        description: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Update QR code

        Args:
            qrcode_id: QR code GUID
            video_id: New video GUID (optional)
            description: New description (optional)
            is_active: Active status (optional)

        Returns:
            Updated QR code data or None on error
        """
        # Get current QR code first
        current = self.get_qrcode(qrcode_id)
        if not current:
            return None

        # Build update payload
        payload = {
            "videoId": video_id if video_id is not None else current.get("videoId"),
            "description": description if description is not None else current.get("description"),
            "isActive": is_active if is_active is not None else current.get("isActive", True)
        }

        try:
            response = self._make_request("PUT", f"/qrcodes/{qrcode_id}", data=payload)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to update QR code: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error updating QR code: {e}")
            return None

    def delete_qrcode(self, qrcode_id: str) -> bool:
        """
        Delete a QR code

        Args:
            qrcode_id: QR code GUID

        Returns:
            True if successful, False otherwise
        """
        try:
            response = self._make_request("DELETE", f"/qrcodes/{qrcode_id}")
            if response.status_code == 204:
                return True
            else:
                print(f"Failed to delete QR code: {response.status_code}")
                return False
        except Exception as e:
            print(f"Error deleting QR code: {e}")
            return False

    def download_qrcode_image(
        self,
        qrcode_id: str,
        output_path: Optional[str] = None
    ) -> Optional[str]:
        """
        Download QR code image (no auth required)

        Args:
            qrcode_id: QR code GUID
            output_path: Output file path (optional, defaults to qrcode-{id}.png)

        Returns:
            Path to saved file or None on error
        """
        if not output_path:
            output_path = f"qrcode-{qrcode_id}.png"

        try:
            response = self._make_request(
                "GET",
                f"/qrcodes/{qrcode_id}/image",
                require_auth=False
            )

            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    f.write(response.content)
                return output_path
            else:
                print(f"Failed to download QR image: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error downloading QR image: {e}")
            return None

    # Statistics operations

    def get_stats_summary(self) -> Optional[Dict[str, Any]]:
        """
        Get dashboard summary statistics

        Returns:
            Dictionary with videoCount, qrCodeCount, scanCount, playCount or None on error
        """
        try:
            response = self._make_request("GET", "/stats/summary")
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to get stats: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error getting stats: {e}")
            return None

    # Log operations

    def list_scan_logs(
        self,
        page: int = 1,
        page_size: int = 50,
        qrcode_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        List scan logs with pagination and optional filtering

        Args:
            page: Page number (default: 1)
            page_size: Number of items per page (default: 50)
            qrcode_id: Filter by QR code GUID

        Returns:
            Dictionary with scan logs or None on error
        """
        params = {"page": page, "pageSize": page_size}
        if qrcode_id:
            params["qrCodeId"] = qrcode_id

        try:
            response = self._make_request("GET", "/logs/scans", params=params)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to list scan logs: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error listing scan logs: {e}")
            return None

    def list_play_logs(
        self,
        page: int = 1,
        page_size: int = 50,
        video_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        List play logs with pagination and optional filtering

        Args:
            page: Page number (default: 1)
            page_size: Number of items per page (default: 50)
            video_id: Filter by video GUID

        Returns:
            Dictionary with play logs or None on error
        """
        params = {"page": page, "pageSize": page_size}
        if video_id:
            params["videoId"] = video_id

        try:
            response = self._make_request("GET", "/logs/plays", params=params)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Failed to list play logs: {response.status_code}")
                return None
        except Exception as e:
            print(f"Error listing play logs: {e}")
            return None
