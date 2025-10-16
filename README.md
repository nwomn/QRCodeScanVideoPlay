# QRCodeScanVideoPlay

一个用于 **扫码播放固定视频** 的 Web 应用，包含前台扫码/播放页面与后台管理系统。项目采用 React（前端） + ASP.NET Core（后端）+ PostgreSQL，支持通过摄像头识别预置二维码并播放对应视频，同时提供后台管理视频资源、二维码生成与统计日志等功能。系统已通过 Nginx 反向代理配置 HTTPS（默认自签证书），可部署在单台 Linux 服务器上。

---

## 功能结构

### 前台（React + Vite + Tailwind + Ant Design 部分组件）
- 摄像头扫码识别二维码，自动跳转播放页
- 手动输入二维码编码（供摄像头不可用时查询）
- Video.js 播放器，自适应屏幕尺寸，记录播放日志

### 后台管理
- 登录鉴权（JWT）
- 视频管理：上传、编辑、启用/禁用、预览
- 二维码管理：绑定视频、生成/下载二维码、启用/禁用
- 日志与仪表盘：扫码次数、播放次数、错误信息可查阅

### 后端 API（ASP.NET Core + EF Core + PostgreSQL）
- 分层结构（Domain/Application/Infrastructure/Presentation）
- EF Core 数据模型与迁移管理
- 本地文件存储（默认存储在 `storage/`，通过静态文件中间件公开 `/videos/`、`/covers/`）
- JWT 身份认证、默认管理员自动初始化
- 日志记录（Serilog），RESTful API 接口

---

## 目录结构（关键部分）

```
QRCodeScanVideoPlay/
├── backend/
│   ├── Domain/                 # 领域实体
│   ├── Application/            # DTO、服务接口、通用配置
│   ├── Infrastructure/         # EF Core 持久化、服务实现、存储
│   └── Presentation/Api/       # ASP.NET Core Web API
├── frontend/                   # React + Vite 前端工程
├── docs/architecture-plan.md   # 系统架构方案文档
├── publish/backend/            # dotnet publish 产物
├── README.md
└── ...
```

---

## 环境要求

- 操作系统：Ubuntu 24.04（已验证）
- 后端：.NET SDK 8.0
- 数据库：PostgreSQL 16
- 前端：Node.js ≥ 18（**建议升级至 20.19+**，Vite 提示要求）
- 运行时依赖：Nginx、OpenSSL（自签证书）、systemd（可选）

---

## 部署步骤

以下流程假设使用一台全新服务器，域名（可选）解析到该服务器；若无域名可以使用自签证书完成 HTTPS。

### 1. 克隆并安装基础依赖

```bash
git clone <repo-url> QRCodeScanVideoPlay
cd QRCodeScanVideoPlay

# 安装 .NET 8 SDK（官方脚本或 apt）
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0

# 安装 Node.js（建议 20.19+，可用 nvm）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PostgreSQL & Nginx
sudo apt-get install -y postgresql postgresql-contrib nginx
```

### 2. 配置数据库

```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres createdb qrvideo

# 进入项目目录，执行数据库迁移
dotnet ef database update \
  --project backend/Infrastructure/QrVideo.Infrastructure/QrVideo.Infrastructure.csproj \
  --startup-project backend/Presentation/Api/QrVideo.Api/QrVideo.Api.csproj
```

### 3. 后端发布

```bash
dotnet publish backend/Presentation/Api/QrVideo.Api/QrVideo.Api.csproj \
   -c Release -o /root/QRCodeScanVideoPlay/publish/backend
```

> 如需修改配置（连接串、JWT 秘钥、存储路径等），请编辑 `backend/Presentation/Api/QrVideo.Api/appsettings.json`，再执行 publish。

### 4. 前端构建

```bash
cd frontend
npm install
npm run build
```

默认 `.env.production` 设置 `VITE_API_BASE_URL=/api`，以便在同一域名下通过 Nginx 反向代理访问 API。

### 5. 生成自签证书（如无正式域名）

```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/qrvideo-selfsigned.key \
  -out /etc/nginx/ssl/qrvideo-selfsigned.crt \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=QRCodeVideo/OU=Dev/CN=$(hostname -I | awk '{print $1}')"
```

若有正式域名，可换用 Let’s Encrypt 等签发的证书，替换 Nginx 配置中的证书路径即可。

### 6. 配置 Nginx 反向代理

在 `/etc/nginx/sites-available/qrvideo.conf` 写入：

```nginx
server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate     /etc/nginx/ssl/qrvideo-selfsigned.crt;
    ssl_certificate_key /etc/nginx/ssl/qrvideo-selfsigned.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    client_max_body_size 512M;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /videos/ {
        proxy_pass http://127.0.0.1:5000/videos/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /covers/ {
        proxy_pass http://127.0.0.1:5000/covers/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:4173/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用配置并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/qrvideo.conf /etc/nginx/sites-enabled/qrvideo.conf
sudo nginx -t
sudo systemctl restart nginx
```

### 7. 运行服务（systemd 或手动）

#### systemd 示例

`/etc/systemd/system/qrvideo-api.service`：

```ini
[Unit]
Description=QR Video Backend API
After=network.target postgresql.service

[Service]
WorkingDirectory=/root/QRCodeScanVideoPlay/publish/backend
ExecStart=/usr/bin/dotnet /root/QRCodeScanVideoPlay/publish/backend/QrVideo.Api.dll --urls=http://0.0.0.0:5000
Environment=ASPNETCORE_ENVIRONMENT=Production
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/qrvideo-frontend.service`：

```ini
[Unit]
Description=QR Video Frontend Preview
After=network.target qrvideo-api.service

[Service]
WorkingDirectory=/root/QRCodeScanVideoPlay/frontend
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 4173 --strictPort
Environment=NODE_ENV=production
Environment=VITE_API_BASE_URL=/api
Restart=always
RestartSec=5
User=root

[Install]
WantedBy=multi-user.target
```

加载并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable qrvideo-api.service qrvideo-frontend.service
sudo systemctl start qrvideo-api.service qrvideo-frontend.service
```

若当前环境不允许使用 systemd，也可手动后台运行：

```bash
# 后端
nohup dotnet /root/QRCodeScanVideoPlay/publish/backend/QrVideo.Api.dll --urls=http://0.0.0.0:5000 >/root/QRCodeScanVideoPlay/backend-api.log 2>&1 &

# 前端
cd /root/QRCodeScanVideoPlay/frontend
nohup npm run preview -- --host 0.0.0.0 --port 4173 --strictPort >/root/QRCodeScanVideoPlay/frontend-preview.log 2>&1 &
```

### 8. 浏览器访问

- 前台扫码页：`https://<服务器IP>/`
- 管理后台：`https://<服务器IP>/admin/login`
- 默认管理员账号：`admin / Admin@123`

> 因为使用自签证书，首次访问会提示“连接不安全”，在浏览器点击“高级 -> 继续访问”即可。若希望完全避免警告，请导入 `/etc/nginx/ssl/qrvideo-selfsigned.crt` 到终端的受信任根证书，或者换用正式域名+可信 CA。

---

## 常见问题

1. **扫码页出现 “Can't enumerate devices”**
   - 浏览器要求 HTTPS 或 localhost 才允许摄像头访问。确保使用 `https://` 或在浏览器设置中临时允许。

2. **扫码识别成功但视频无法播放**
   - 确认 Nginx 配置中已有 `/videos/` 代理；若无，参考上文配置。此外，`LocalStorageService` 已调整为返回以 `/` 开头的路径，旧数据重新请求即可生效。

3. **登录按钮无响应**
   - 检查前端的 `VITE_API_BASE_URL` 是否为 `/api`，并确认 Nginx `/api` 代理正常工作。

4. **浏览器提示不安全连接**
   - 自签证书导致，导入证书或换用可信证书即可。

5. **播放器尺寸不合适**
   - 已启用 Video.js `fluid` 模式，自适应容器宽度；若需更改显示比例，可在 `VideoPlayer` 组件中调整 `player.aspectRatio()`。

---

## 后续优化建议

- 升级 Node.js 至 ≥ 20.19 以符合 Vite 官方要求
- 使用 Let’s Encrypt 或购买的证书替换自签证书
- 将静态前端改为 Nginx 直接托管 `frontend/dist`，提高效率
- 支持 HLS/DASH 流媒体、自动转码、视频元数据提取等高级功能
- 引入 CI/CD 或 Docker Compose，自动化部署流程

---

## 联系与支持

如遇部署问题或希望添加新功能，建议先确认日志：

- 后端：`journalctl -u qrvideo-api.service -f` 或 `backend-api.log`
- 前端：`journalctl -u qrvideo-frontend.service -f` 或 `frontend-preview.log`
- Nginx：`journalctl -u nginx -f`、`/var/log/nginx/error.log`

有更多需求可以根据实际情况继续扩展。祝使用愉快！
