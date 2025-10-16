# 多平台二维码扫码视频播放项目方案

## 一、总体目标
- 实现一个网页端应用，用户通过摄像头扫描预设二维码后自动播放对应视频。
- 提供管理后台，支持视频资源上传、二维码生成与映射维护、查看扫码/播放统计及错误日志。
- 项目快速交付，保留后续扩展空间（播放器协议、防盗链、访问控制、多平台接入等）。

## 二、整体架构
- **前端**
  - 技术栈：React + TypeScript + Vite。
  - UI：前台使用 TailwindCSS 构建轻量界面；后台采用 Ant Design 提升开发效率。
  - 模块：扫码界面、播放器界面、后台登录、视频管理、二维码管理、统计仪表盘。
  - 适配器：封装 `ScannerAdapter` 与 `PlayerAdapter`，默认实现分别使用 `@zxing/browser` 与 `video.js`（MP4），支持后续扩展 HLS/DASH 或原生终端实现。
- **后端**
  - 技术栈：ASP.NET Core 8 Web API（C#）。
  - 分层结构：Domain、Application、Infrastructure、Presentation，便于扩展和测试。
  - ORM：EF Core，数据库选 PostgreSQL（可替换为 SQL Server/SQLite）。
  - 文件存储：通过 `IStorageAdapter` 抽象，初期保存到本地磁盘，后续可迁移至对象存储（OSS/S3）。
  - 身份认证：后台使用 JWT + HttpOnly Cookie（或 ASP.NET Identity）实现简单账户体系。
  - 日志与统计：ScanLog、PlayLog 表记录操作，Serilog 输出服务日志。
- **部署**
  - 云服务器上运行 Nginx（反向代理 + 静态资源 + HTTPS）。
  - ASP.NET Core 后端以 systemd 方式常驻；前端构建后部署为静态文件。
  - 数据与大文件初期同机储存，后续可扩展 CDN/OSS。

## 三、核心功能模块
1. **扫码播放前台**
   - 摄像头授权与实时预览。
   - 二维码识别 → 校验映射 → 跳转/加载视频播放页。
   - 播放器控制：播放/暂停、进度条、全屏（保留扩展倍速/字幕接口）。
   - 播放完成后可选择重播或返回扫码界面。
2. **管理后台**
   - 登录/退出。
   - 视频管理：上传、编辑元数据、预览、删除。
   - 二维码映射：绑定视频、生成二维码图片、下载导出。
   - 统计面板：扫码次数、播放次数、错误日志列表，支持按日期筛选。
3. **后端服务**
   - 用户认证：账号维护、JWT 颁发、会话校验。
   - 视频服务：文件上传、元数据存储、访问 URL 生成。
   - 二维码服务：映射创建、二维码图像生成（QRCoder）。
   - 日志服务：记录/查询扫码与播放行为；提供分页查询。

## 四、数据模型（草案）
- `AdminUser`：Id、Username、PasswordHash、CreatedAt、LastLoginAt。
- `Video`：Id、Title、Description、FilePath、CoverPath、Duration、CreatedAt。
- `QRCode`：Id、CodeValue、VideoId、Status（启用/禁用）、CreatedAt。
- `ScanLog`：Id、QRCodeId、Timestamp、ClientInfo、Result（Success/Fail）、FailReason。
- `PlayLog`：Id、VideoId、Timestamp、ClientInfo、Duration, Result（Completed/Interrupted）。

## 五、接口与前后端交互
- RESTful API（JSON），结合 Swagger 自动文档。
- 主要端点：
  - `POST /api/auth/login`、`POST /api/auth/logout`
  - `GET/POST/PUT/DELETE /api/videos`
  - `POST /api/videos/{id}/upload`（大文件分块可后续扩展）
  - `GET/POST/DELETE /api/qrcodes`
  - `GET /api/stats/scans`，`GET /api/stats/plays`
  - `POST /api/logs/scan`、`POST /api/logs/play`

## 六、开发节奏
1. 需求确认 & UI 草图。
2. 初始化仓库：前端与后端项目骨架、CI 脚本。
3. 数据库建模、迁移、身份认证基础。
4. 实现视频/二维码 CRUD 与文件上传。
5. 前台扫码与播放流程，接入日志记录。
6. 管理后台界面与统计面板。
7. 部署、HTTPS 配置、回归测试。

## 七、扩展预案
- 扫码与播放适配器接口，支持原生 App、桌面端。
- 播放协议：后续接入 HLS/DASH、DRM。
- 访问控制：二维码时效、签名校验、防盗链。
- 云存储与 CDN：迁移视频及二维码到对象存储，提升可扩展性。
- 权限体系：多角色、多租户。

## 八、后续工作指引
- 根据该方案开始初始化项目结构并逐步实现核心功能。
- 维护此文档，迭代补充接口细节与部署脚本说明。

