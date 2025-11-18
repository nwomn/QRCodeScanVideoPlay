# 后端API增强计划

## 概述

本文档描述了QR视频系统后端API的增强计划，旨在提供更高效的批量操作和数据管理能力。

当前状态：Python CLI工具已实现，可满足大部分批量操作需求。后端API增强为长期优化方案。

## 现有API能力评估

### ✅ 已实现的功能

**认证**
- JWT令牌认证
- 2小时token有效期

**视频管理**
- CRUD操作（创建、读取、更新、删除）
- 分页列表（支持搜索）
- 文件上传（最大2GB）

**二维码管理**
- CRUD操作
- 分页列表（支持按video ID筛选）
- 图片下载（公开访问）

**统计和日志**
- 概览统计
- 扫描日志（分页、可筛选）
- 播放日志（分页、可筛选）

### ❌ 缺失的功能

**批量操作**
- 批量视频上传
- 批量二维码创建
- 批量删除操作
- 批量状态更新

**高级查询**
- 日期范围筛选
- 多条件组合筛选
- 排序选项
- 全文搜索

**数据导出**
- CSV/JSON导出
- 批量数据备份
- 导入功能

**性能优化**
- 缓存机制
- 批处理优化
- 异步任务队列

## 增强方案设计

### 阶段1: 批量操作端点（高优先级）

#### 1.1 批量视频管理

**POST /api/videos/batch**

上传多个视频的元数据（不包含文件）

```csharp
// Request
{
  "videos": [
    {
      "title": "string",
      "description": "string",
      "filePath": "string",  // 预先上传到临时位置
      "isActive": true
    }
  ]
}

// Response
{
  "created": [
    { "id": "guid", "title": "string", "status": "success" }
  ],
  "failed": [
    { "title": "string", "reason": "error message" }
  ]
}
```

**DELETE /api/videos/batch**

批量删除视频

```csharp
// Request
{
  "ids": ["guid1", "guid2", "..."]
}

// Response
{
  "deleted": ["guid1", "guid2"],
  "failed": [
    { "id": "guid3", "reason": "Not found" }
  ]
}
```

**PATCH /api/videos/batch/status**

批量更新视频状态

```csharp
// Request
{
  "ids": ["guid1", "guid2"],
  "isActive": true
}

// Response
{
  "updated": 2,
  "failed": 0
}
```

#### 1.2 批量二维码管理

**POST /api/qrcodes/batch**

批量创建二维码

```csharp
// Request
{
  "qrcodes": [
    {
      "videoId": "guid",
      "description": "string",
      "isActive": true
    }
  ]
}

// Response
{
  "created": [
    {
      "id": "guid",
      "codeValue": "string",
      "videoId": "guid",
      "videoTitle": "string"
    }
  ],
  "failed": [
    {
      "videoId": "guid",
      "reason": "Video not found"
    }
  ]
}
```

**DELETE /api/qrcodes/batch**

批量删除二维码

```csharp
// Request
{
  "ids": ["guid1", "guid2"]
}

// Response
{
  "deleted": 2,
  "failed": 0
}
```

**PATCH /api/qrcodes/batch/rebind**

批量重新绑定视频

```csharp
// Request
{
  "mappings": [
    { "qrCodeId": "guid1", "videoId": "new-guid1" },
    { "qrCodeId": "guid2", "videoId": "new-guid2" }
  ]
}

// Response
{
  "updated": [
    { "qrCodeId": "guid1", "newVideoTitle": "..." }
  ],
  "failed": []
}
```

### 阶段2: 高级查询端点（中优先级）

#### 2.1 高级视频搜索

**GET /api/videos/search**

```csharp
// Query Parameters
?search=keyword           // 关键词搜索
&dateFrom=2024-01-01     // 创建日期起始
&dateTo=2024-12-31       // 创建日期结束
&minSize=0               // 最小文件大小（字节）
&maxSize=1073741824      // 最大文件大小（字节）
&contentType=video/mp4   // 内容类型
&isActive=true           // 激活状态
&sortBy=createdAt        // 排序字段
&sortOrder=desc          // 排序方向
&page=1
&pageSize=20

// Response: 标准分页结果
```

#### 2.2 高级二维码搜索

**GET /api/qrcodes/search**

```csharp
// Query Parameters
?videoId=guid            // 视频ID
&dateFrom=2024-01-01     // 创建日期起始
&dateTo=2024-12-31       // 创建日期结束
&isActive=true           // 激活状态
&hasDescription=true     // 是否有描述
&sortBy=createdAt
&sortOrder=desc
&page=1
&pageSize=20
```

### 阶段3: 数据导出端点（中优先级）

#### 3.1 视频导出

**GET /api/videos/export**

```csharp
// Query Parameters
?format=csv              // csv | json
&search=keyword          // 可选筛选
&dateFrom=2024-01-01
&dateTo=2024-12-31

// Response
Content-Type: text/csv 或 application/json
Content-Disposition: attachment; filename="videos_export.csv"
```

#### 3.2 二维码导出

**GET /api/qrcodes/export**

```csharp
// Query Parameters
?format=csv              // csv | json
&videoId=guid            // 可选筛选

// Response
Content-Type: text/csv 或 application/json
Content-Disposition: attachment; filename="qrcodes_export.csv"
```

#### 3.3 日志导出

**GET /api/logs/export**

```csharp
// Query Parameters
?type=scan|play          // 日志类型
&dateFrom=2024-01-01
&dateTo=2024-12-31
&format=csv

// Response
CSV或JSON格式的日志数据
```

### 阶段4: 高级统计端点（低优先级）

#### 4.1 视频详细统计

**GET /api/stats/videos/{id}**

```csharp
// Response
{
  "videoId": "guid",
  "title": "string",
  "totalViews": 123,
  "totalScans": 45,
  "completionRate": 0.75,
  "averageWatchTime": "00:05:30",
  "qrCodeCount": 5,
  "last30Days": {
    "views": 50,
    "scans": 20
  }
}
```

#### 4.2 二维码详细统计

**GET /api/stats/qrcodes/{id}**

```csharp
// Response
{
  "qrCodeId": "guid",
  "codeValue": "string",
  "totalScans": 45,
  "successfulScans": 42,
  "failedScans": 3,
  "last30Days": {
    "scans": 20
  },
  "scanTimeline": [
    { "date": "2024-01-01", "count": 5 },
    { "date": "2024-01-02", "count": 3 }
  ]
}
```

#### 4.3 热门内容统计

**GET /api/stats/trending**

```csharp
// Query Parameters
?period=day|week|month   // 时间段
&limit=10                // 返回数量

// Response
{
  "topVideos": [
    {
      "id": "guid",
      "title": "string",
      "views": 1000,
      "scans": 500
    }
  ],
  "topQrCodes": [
    {
      "id": "guid",
      "codeValue": "string",
      "scans": 500
    }
  ]
}
```

## 实施建议

### 优先级划分

**P0 - 立即实施（当前不需要，CLI工具已满足）**
- Python CLI工具（已完成）

**P1 - 3个月内**
- 批量操作端点（如果Web UI需要）
- 基础导出功能

**P2 - 6个月内**
- 高级搜索功能
- 完整导出功能

**P3 - 12个月内**
- 高级统计分析
- 性能优化

### 技术实现建议

#### 后端实现（C# ASP.NET Core）

1. **批量操作控制器**

```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BatchController : ControllerBase
{
    [HttpPost("videos")]
    [RequestSizeLimit(4294967296)] // 4GB for batch operations
    public async Task<IActionResult> BatchCreateVideos([FromBody] BatchVideoRequest request)
    {
        var results = new BatchVideoResponse();

        foreach (var video in request.Videos)
        {
            try
            {
                var created = await _videoService.CreateAsync(video);
                results.Created.Add(created);
            }
            catch (Exception ex)
            {
                results.Failed.Add(new FailedItem
                {
                    Title = video.Title,
                    Reason = ex.Message
                });
            }
        }

        return Ok(results);
    }

    [HttpDelete("videos")]
    public async Task<IActionResult> BatchDeleteVideos([FromBody] BatchDeleteRequest request)
    {
        var results = new BatchDeleteResponse();

        foreach (var id in request.Ids)
        {
            try
            {
                await _videoService.DeleteAsync(id);
                results.Deleted.Add(id);
            }
            catch (Exception ex)
            {
                results.Failed.Add(new FailedItem
                {
                    Id = id,
                    Reason = ex.Message
                });
            }
        }

        return Ok(results);
    }
}
```

2. **导出功能服务**

```csharp
public class ExportService
{
    public async Task<byte[]> ExportVideosToCsv(VideoFilter filter)
    {
        var videos = await _videoRepository.GetAllAsync(filter);

        using var ms = new MemoryStream();
        using var writer = new StreamWriter(ms);
        using var csv = new CsvWriter(writer, CultureInfo.InvariantCulture);

        csv.WriteRecords(videos);
        await writer.FlushAsync();

        return ms.ToArray();
    }

    public async Task<byte[]> ExportVideosToJson(VideoFilter filter)
    {
        var videos = await _videoRepository.GetAllAsync(filter);
        var json = JsonSerializer.Serialize(videos, new JsonSerializerOptions
        {
            WriteIndented = true
        });

        return Encoding.UTF8.GetBytes(json);
    }
}
```

3. **高级查询支持**

```csharp
public class VideoQueryBuilder
{
    private IQueryable<Video> _query;

    public VideoQueryBuilder ApplyFilters(VideoSearchRequest request)
    {
        if (!string.IsNullOrEmpty(request.Search))
        {
            _query = _query.Where(v =>
                v.Title.Contains(request.Search) ||
                v.Description.Contains(request.Search)
            );
        }

        if (request.DateFrom.HasValue)
        {
            _query = _query.Where(v => v.CreatedAt >= request.DateFrom);
        }

        if (request.DateTo.HasValue)
        {
            _query = _query.Where(v => v.CreatedAt <= request.DateTo);
        }

        if (request.MinSize.HasValue)
        {
            _query = _query.Where(v => v.FileSize >= request.MinSize);
        }

        if (request.MaxSize.HasValue)
        {
            _query = _query.Where(v => v.FileSize <= request.MaxSize);
        }

        return this;
    }

    public VideoQueryBuilder ApplySorting(string sortBy, string sortOrder)
    {
        var orderByExpression = GetOrderByExpression(sortBy);

        _query = sortOrder.ToLower() == "desc"
            ? _query.OrderByDescending(orderByExpression)
            : _query.OrderBy(orderByExpression);

        return this;
    }
}
```

### 前端集成

如果实施了后端批量API，前端可以相应更新：

```typescript
// API service
export const batchCreateQrCodes = async (qrcodes: QrCodeBatchRequest[]) => {
  const response = await api.post('/qrcodes/batch', { qrcodes });
  return response.data;
};

export const exportVideos = async (format: 'csv' | 'json') => {
  const response = await api.get('/videos/export', {
    params: { format },
    responseType: 'blob'
  });

  // Trigger download
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `videos_export.${format}`;
  link.click();
};
```

## 性能考虑

### 批量操作优化

1. **使用数据库批处理**

```csharp
// 使用 EF Core BulkExtensions
await _context.BulkInsertAsync(videos);
await _context.BulkDeleteAsync(videos);
await _context.BulkUpdateAsync(videos);
```

2. **异步处理**

```csharp
// 对于大批量操作，使用后台作业
[HttpPost("videos/batch/async")]
public async Task<IActionResult> BatchCreateVideosAsync([FromBody] BatchVideoRequest request)
{
    var jobId = await _backgroundJobService.EnqueueAsync(() =>
        ProcessBatchVideos(request)
    );

    return Accepted(new { jobId, status = "processing" });
}

// 查询作业状态
[HttpGet("jobs/{jobId}")]
public async Task<IActionResult> GetJobStatus(string jobId)
{
    var status = await _backgroundJobService.GetStatusAsync(jobId);
    return Ok(status);
}
```

3. **限流保护**

```csharp
// 在Startup.cs中配置
services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("batch", opt =>
    {
        opt.Window = TimeSpan.FromMinutes(1);
        opt.PermitLimit = 10; // 每分钟最多10次批量操作
    });
});

// 在控制器中应用
[EnableRateLimiting("batch")]
[HttpPost("videos/batch")]
public async Task<IActionResult> BatchCreateVideos(...)
{
    // ...
}
```

## 监控和日志

### 批量操作审计

```csharp
public class BatchOperationLog
{
    public Guid Id { get; set; }
    public string UserId { get; set; }
    public string Operation { get; set; } // "BatchCreateVideos", "BatchDeleteQrCodes"
    public int ItemCount { get; set; }
    public int SuccessCount { get; set; }
    public int FailureCount { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public TimeSpan Duration { get; set; }
    public string Details { get; set; } // JSON with failures
}
```

### 性能指标

- 批量操作平均响应时间
- 批量操作成功率
- 并发批量操作数量
- 数据库连接池使用率

## 测试计划

### 单元测试

```csharp
[Fact]
public async Task BatchCreateVideos_Should_Create_All_Valid_Videos()
{
    // Arrange
    var request = new BatchVideoRequest
    {
        Videos = new[]
        {
            new VideoCreateDto { Title = "Video 1" },
            new VideoCreateDto { Title = "Video 2" }
        }
    };

    // Act
    var result = await _controller.BatchCreateVideos(request);

    // Assert
    var okResult = Assert.IsType<OkObjectResult>(result);
    var response = Assert.IsType<BatchVideoResponse>(okResult.Value);
    Assert.Equal(2, response.Created.Count);
    Assert.Empty(response.Failed);
}
```

### 集成测试

```csharp
[Fact]
public async Task BatchOperations_Should_Be_Atomic()
{
    // Test that partial failures don't corrupt data
    // Test transaction rollback on errors
    // Test concurrent batch operations
}
```

### 负载测试

```bash
# 使用 k6 或 Apache Bench
k6 run --vus 10 --duration 30s batch_load_test.js
```

## 迁移策略

### 向后兼容性

- 保留所有现有API端点
- 新端点使用 `/api/v2/` 前缀（可选）
- 提供迁移指南

### 部署步骤

1. 部署后端API更新（无中断）
2. 更新API文档
3. 逐步迁移客户端
4. 监控性能指标
5. 优化和调整

## 成本效益分析

### 开发成本

- 阶段1（批量操作）：40-60 小时
- 阶段2（高级查询）：20-30 小时
- 阶段3（数据导出）：20-30 小时
- 阶段4（高级统计）：30-40 小时

总计：110-160 小时

### 收益

- 减少API调用次数（节省服务器资源）
- 提升用户体验（更快的批量操作）
- 降低网络延迟（单次请求vs多次请求）
- 简化客户端逻辑

## 总结

当前Python CLI工具已能满足大部分批量操作需求，后端API增强可以作为长期规划逐步实施。建议根据实际使用需求和用户反馈，按优先级逐步实现。

**短期（当前）：** 使用Python CLI工具进行批量管理

**中期（3-6个月）：** 如果Web UI需要批量功能，实施阶段1和阶段3

**长期（12个月）：** 根据需求实施高级统计和性能优化
