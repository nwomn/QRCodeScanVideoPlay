# QR Video CLI

命令行工具，用于通过API高效管理QR视频系统。

## 功能特性

- ✅ **身份认证**: JWT令牌管理和持久化
- ✅ **视频管理**: 上传、列表、更新、删除视频
- ✅ **批量上传**: 从目录批量上传多个视频文件
- ✅ **二维码管理**: 创建、列表、更新、删除二维码
- ✅ **批量生成**: 从CSV文件批量生成二维码
- ✅ **数据导出**: 导出视频和二维码数据到CSV
- ✅ **统计查看**: 查看系统统计和日志
- ✅ **图片下载**: 批量下载二维码图片

## 系统要求

- Python 3.7+
- 网络访问到QR视频系统API

## 安装

### 方法 1: 直接使用（推荐）

```bash
cd /root/QRCodeScanVideoPlay/qrvideo-cli

# 安装依赖
pip3 install -r requirements.txt

# 使用CLI
python3 -m qrvideo_cli.cli --help
```

### 方法 2: 安装为系统命令

```bash
cd /root/QRCodeScanVideoPlay/qrvideo-cli

# 安装
pip3 install -e .

# 现在可以直接使用qrvideo命令
qrvideo --help
```

## 快速开始

### 1. 登录认证

```bash
# 登录（凭证会保存到 ~/.qrvideo_cli/config）
python3 -m qrvideo_cli.cli login admin Admin@123

# 或者使用环境变量
export QRVIDEO_API_URL=https://mzfmedia.cn/api
python3 -m qrvideo_cli.cli login admin Admin@123
```

### 2. 查看统计

```bash
python3 -m qrvideo_cli.cli stats
```

输出示例：
```
Dashboard Summary:
  Videos: 15
  QR Codes: 23
  Total Scans: 145
  Total Plays: 112
```

### 3. 列出视频

```bash
# 列出所有视频（第1页，每页20条）
python3 -m qrvideo_cli.cli videos list

# 搜索视频
python3 -m qrvideo_cli.cli videos list --search "产品演示"

# 指定页码和页大小
python3 -m qrvideo_cli.cli videos list --page 2 --size 50
```

## 完整命令参考

### 认证命令

```bash
# 登录
qrvideo login <username> <password>
```

### 视频管理命令

```bash
# 列出视频
qrvideo videos list [--page PAGE] [--size SIZE] [--search TERM]

# 上传单个视频
qrvideo videos upload "<标题>" /path/to/video.mp4 [--description "描述"]

# 批量上传视频
qrvideo videos bulk-upload /path/to/videos [--pattern "*.mp4"] [--recursive]

# 导出视频到CSV
qrvideo videos export [--output videos.csv] [--search TERM]

# 删除视频
qrvideo videos delete <video_id>
```

### 二维码管理命令

```bash
# 列出二维码
qrvideo qrcodes list [--page PAGE] [--size SIZE] [--video-id ID]

# 创建二维码
qrvideo qrcodes create <video_id> [--description "描述"] [--inactive]

# 批量创建二维码（从CSV）
qrvideo qrcodes bulk-create qrcodes.csv [--download-images] [--output-dir qr_images]

# 导出二维码到CSV
qrvideo qrcodes export [--output qrcodes.csv] [--video-id ID]

# 下载所有二维码图片
qrvideo qrcodes download-all [--output-dir qr_images] [--video-id ID]

# 删除二维码
qrvideo qrcodes delete <qrcode_id>
```

### 统计和日志命令

```bash
# 显示统计
qrvideo stats

# 查看扫描日志
qrvideo logs scans [--page PAGE] [--size SIZE] [--qrcode-id ID]

# 查看播放日志
qrvideo logs plays [--page PAGE] [--size SIZE] [--video-id ID]
```

## 使用示例

### 场景1: 批量上传视频

```bash
# 上传目录下所有mp4文件
qrvideo videos bulk-upload /path/to/videos --pattern "*.mp4"

# 递归上传（包含子目录）
qrvideo videos bulk-upload /path/to/videos --pattern "*.mp4" --recursive

# 上传其他格式
qrvideo videos bulk-upload /path/to/videos --pattern "*.avi"
```

输出示例：
```
Found 5 video files

[1/5] Uploading product_demo.mp4...
✓ Uploaded: product_demo (ID: 123e4567-e89b-12d3-a456-426614174000)

[2/5] Uploading tutorial.mp4...
✓ Uploaded: tutorial (ID: 987fcdeb-51a2-43c7-b9e0-123456789abc)

...

============================================================
Upload Summary:
  Success: 5
  Failed: 0
```

### 场景2: 从CSV批量生成二维码

1. 首先，创建CSV文件 `qrcodes.csv`:

```csv
video_id,description,is_active
123e4567-e89b-12d3-a456-426614174000,产品A二维码,true
987fcdeb-51a2-43c7-b9e0-123456789abc,产品B二维码,true
```

2. 批量生成二维码：

```bash
# 仅创建二维码
qrvideo qrcodes bulk-create qrcodes.csv

# 创建并下载图片
qrvideo qrcodes bulk-create qrcodes.csv --download-images --output-dir ./qr_codes
```

输出示例：
```
Processing 2 QR codes...

[1/2] Creating QR for video 123e4567-e89b-12d3-a456-426614174000...
✓ Created: ABC123XYZ -> product_demo
  Image saved: qr_codes/qr-ABC123XYZ.png

[2/2] Creating QR for video 987fcdeb-51a2-43c7-b9e0-123456789abc...
✓ Created: DEF456UVW -> tutorial
  Image saved: qr_codes/qr-DEF456UVW.png

============================================================
Bulk QR Creation Summary:
  Success: 2
  Failed: 0
```

### 场景3: 导出数据进行备份

```bash
# 导出所有视频
qrvideo videos export --output backup_videos.csv

# 导出所有二维码
qrvideo qrcodes export --output backup_qrcodes.csv

# 下载所有二维码图片
qrvideo qrcodes download-all --output-dir backup_qr_images
```

### 场景4: 数据筛选和查询

```bash
# 搜索特定视频
qrvideo videos list --search "产品演示"

# 查看特定视频的二维码
qrvideo qrcodes list --video-id 123e4567-e89b-12d3-a456-426614174000

# 导出特定视频的二维码
qrvideo qrcodes export --video-id 123e4567-e89b-12d3-a456-426614174000 --output video_qrcodes.csv

# 查看特定二维码的扫描日志
qrvideo logs scans --qrcode-id abc123

# 查看特定视频的播放日志
qrvideo logs plays --video-id 123e4567-e89b-12d3-a456-426614174000
```

## CSV文件格式

### 批量创建二维码的CSV格式

文件名: `qrcodes.csv`

```csv
video_id,description,is_active
guid-1,描述文本1,true
guid-2,描述文本2,false
guid-3,,true
```

字段说明：
- `video_id`: 视频的GUID（必填）
- `description`: 二维码描述（可选）
- `is_active`: 是否激活，true/false（可选，默认true）

### 导出的视频CSV格式

导出的视频包含以下字段：
- id, title, description, filePath, coverPath, duration, contentType, fileSize, isActive, createdAt

### 导出的二维码CSV格式

导出的二维码包含以下字段：
- id, codeValue, videoId, videoTitle, isActive, createdAt, description

## 配置选项

### 环境变量

```bash
# API地址
export QRVIDEO_API_URL=https://mzfmedia.cn/api

# 默认凭证（不推荐，建议使用login命令）
export QRVIDEO_USERNAME=admin
export QRVIDEO_PASSWORD=Admin@123
```

### 配置文件

登录凭证会自动保存到 `~/.qrvideo_cli/config`

## Python API使用

除了命令行工具，您也可以在Python脚本中直接使用API客户端：

```python
from qrvideo_cli.api import QRVideoClient

# 创建客户端
client = QRVideoClient("https://mzfmedia.cn/api")

# 登录
if client.login("admin", "Admin@123"):
    print(f"Logged in as {client.username}")

    # 列出视频
    videos = client.list_videos(page=1, page_size=20)
    for video in videos['items']:
        print(f"- {video['title']}")

    # 上传视频
    result = client.upload_video(
        title="测试视频",
        file_path="/path/to/video.mp4",
        description="这是一个测试"
    )

    # 创建二维码
    qr = client.create_qrcode(
        video_id=result['id'],
        description="测试二维码"
    )

    # 下载二维码图片
    client.download_qrcode_image(qr['id'], "test_qr.png")

    # 获取统计
    stats = client.get_stats_summary()
    print(f"Total videos: {stats['videoCount']}")
```

## 批量操作示例

使用Python脚本进行更复杂的批量操作：

```python
from qrvideo_cli.api import QRVideoClient
from qrvideo_cli import batch

client = QRVideoClient()
client.login("admin", "Admin@123")

# 批量上传
batch.bulk_upload_videos(
    client,
    directory="/path/to/videos",
    file_pattern="*.mp4",
    recursive=True
)

# 从CSV批量创建二维码
batch.bulk_create_qrcodes_from_csv(
    client,
    csv_file="qrcodes.csv",
    download_images=True,
    output_dir="qr_images"
)

# 导出数据
batch.export_videos_to_csv(client, "all_videos.csv")
batch.export_qrcodes_to_csv(client, "all_qrcodes.csv")

# 下载所有二维码图片
batch.download_all_qr_images(client, output_dir="all_qr_images")
```

## 常见问题

### Q: 如何处理大文件上传？

A: 视频上传限制为2GB，超时设置为30分钟。对于更大的文件，建议直接联系服务器管理员。

### Q: 凭证保存在哪里？

A: 登录凭证保存在 `~/.qrvideo_cli/config` 文件中，权限为600（仅所有者可读写）。

### Q: 如何更换API地址？

A: 使用 `--api-url` 参数或设置 `QRVIDEO_API_URL` 环境变量。

### Q: 批量操作失败怎么办？

A: 批量操作会显示详细的成功/失败统计。检查失败项的错误信息，常见原因包括：
- 视频ID不存在
- 文件格式不支持
- 网络连接问题
- 权限不足

### Q: CSV文件编码问题？

A: 确保CSV文件使用UTF-8编码。如果在Excel中创建，保存时选择"CSV UTF-8"格式。

## API端点参考

完整的API端点文档请访问：`https://mzfmedia.cn/swagger`

## 故障排查

### 认证失败

```bash
# 检查凭证
cat ~/.qrvideo_cli/config

# 重新登录
qrvideo login admin Admin@123
```

### 网络连接问题

```bash
# 测试API连通性
curl https://mzfmedia.cn/api/stats/summary

# 使用自定义API地址
qrvideo --api-url http://localhost:5000/api stats
```

### 权限问题

确保已登录且token未过期（2小时有效期）。如果过期，重新执行login命令。

## 贡献

欢迎提交问题和功能请求到项目仓库。

## 许可证

MIT License

## 版本历史

### v1.0.0 (2025-11-18)
- ✅ 初始版本发布
- ✅ 完整的视频和二维码管理功能
- ✅ 批量操作支持
- ✅ CSV导入导出
- ✅ 统计和日志查看
