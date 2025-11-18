# QR Video CLI - 快速入门指南

## 工具位置

CLI工具已安装在：`/root/QRCodeScanVideoPlay/qrvideo-cli/`

## 立即使用（无需安装）

```bash
# 进入工具目录
cd /root/QRCodeScanVideoPlay/qrvideo-cli

# 查看帮助
python3 -m qrvideo_cli.cli --help

# 登录（已为您登录）
python3 -m qrvideo_cli.cli login admin Admin@123

# 查看统计
python3 -m qrvideo_cli.cli stats

# 列出视频
python3 -m qrvideo_cli.cli videos list --size 10

# 列出二维码
python3 -m qrvideo_cli.cli qrcodes list --size 10
```

## 常用命令速查

### 视频管理

```bash
# 上传单个视频
python3 -m qrvideo_cli.cli videos upload "视频标题" /path/to/video.mp4 --description "描述"

# 批量上传视频（从目录）
python3 -m qrvideo_cli.cli videos bulk-upload /path/to/videos --pattern "*.mp4"

# 搜索视频
python3 -m qrvideo_cli.cli videos list --search "关键词"

# 导出视频列表到CSV
python3 -m qrvideo_cli.cli videos export --output videos.csv

# 删除视频
python3 -m qrvideo_cli.cli videos delete <video_id>
```

### 二维码管理

```bash
# 创建二维码
python3 -m qrvideo_cli.cli qrcodes create <video_id> --description "二维码描述"

# 批量创建二维码（从CSV）
python3 -m qrvideo_cli.cli qrcodes bulk-create qrcodes.csv --download-images

# 导出二维码列表到CSV
python3 -m qrvideo_cli.cli qrcodes export --output qrcodes.csv

# 下载所有二维码图片
python3 -m qrvideo_cli.cli qrcodes download-all --output-dir qr_images

# 删除二维码
python3 -m qrvideo_cli.cli qrcodes delete <qrcode_id>
```

### 统计和日志

```bash
# 查看系统统计
python3 -m qrvideo_cli.cli stats

# 查看扫描日志
python3 -m qrvideo_cli.cli logs scans --size 20

# 查看播放日志
python3 -m qrvideo_cli.cli logs plays --size 20
```

## 批量操作工作流

### 场景1: 批量上传视频并生成二维码

```bash
# 1. 批量上传视频
python3 -m qrvideo_cli.cli videos bulk-upload /path/to/videos

# 2. 导出视频列表获取ID
python3 -m qrvideo_cli.cli videos export --output videos.csv

# 3. 编辑CSV文件，创建二维码批量创建文件
# 格式: video_id,description,is_active

# 4. 批量创建二维码并下载图片
python3 -m qrvideo_cli.cli qrcodes bulk-create qrcodes.csv --download-images
```

### 场景2: 数据备份

```bash
# 导出所有数据
python3 -m qrvideo_cli.cli videos export --output backup_videos.csv
python3 -m qrvideo_cli.cli qrcodes export --output backup_qrcodes.csv
python3 -m qrvideo_cli.cli qrcodes download-all --output-dir backup_qr_images
```

## 使用示例脚本

```bash
# 进入示例目录
cd /root/QRCodeScanVideoPlay/qrvideo-cli/examples

# 运行批量上传和生成二维码示例
python3 bulk_upload_and_create_qr.py

# 运行数据备份示例
python3 backup_all_data.py

# 运行Shell脚本示例
bash common_operations.sh
```

## CSV文件模板

二维码批量创建CSV模板位于：
`/root/QRCodeScanVideoPlay/qrvideo-cli/examples/qrcodes_template.csv`

## 完整文档

- README: `/root/QRCodeScanVideoPlay/qrvideo-cli/README.md`
- 后端增强计划: `/root/QRCodeScanVideoPlay/qrvideo-cli/BACKEND_ENHANCEMENT_PLAN.md`

## 技术支持

如有问题，请查看：
1. README.md 中的常见问题部分
2. examples/ 目录中的示例代码
3. 使用 `--help` 查看命令帮助

## 提示

- 凭证会自动保存到 `~/.qrvideo_cli/config`，有效期2小时
- 批量操作会显示详细的进度和结果
- 所有操作都支持 `--help` 查看详细参数
- 可以设置环境变量 `QRVIDEO_API_URL` 来更改API地址
