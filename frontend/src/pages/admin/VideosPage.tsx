import { useMemo, useState, useEffect } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Progress, Space, Switch, Table, Tag, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { UploadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  createVideo,
  deleteVideo,
  fetchVideos,
  updateVideo,
  type VideoDto,
  type PagedResult,
} from '../../services/videos';

interface VideoTableRecord extends VideoDto {
  key: string;
}

export const VideosPage = () => {
  useEffect(() => {
    document.title = '视频管理 - QR视频播放系统';
  }, []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PagedResult<VideoDto>>({
    queryKey: ['videos', page, pageSize, search],
    queryFn: () => fetchVideos({ page, pageSize, search }),
    placeholderData: (previousData) => previousData,
  });

  const createMutation = useMutation({
    mutationFn: createVideo,
    onSuccess: () => {
      message.success('上传成功');
      setIsModalOpen(false);
      setUploadProgress(0);
      form.resetFields();
      setSelectedFile(null);
      void queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (err: unknown) => {
      setUploadProgress(0);
      message.error(err instanceof Error ? err.message : '上传失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { title: string; description?: string; isActive: boolean } }) =>
      updateVideo(id, payload),
    onSuccess: () => {
      message.success('更新成功');
      void queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVideo,
    onSuccess: () => {
      message.success('删除成功');
      void queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error: unknown) => {
      message.error(error instanceof Error ? error.message : '删除失败');
    },
  });

  const columns: ColumnsType<VideoTableRecord> = useMemo(
    () => [
      {
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        render: (value: string) => <span className="font-medium">{value}</span>,
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        ellipsis: true,
        render: (value?: string) => value ?? '--',
      },
      {
        title: '状态',
        dataIndex: 'isActive',
        key: 'isActive',
        render: (_value, record) => (
          <Switch
            checked={record.isActive}
            onChange={(checked) =>
              updateMutation.mutate({
                id: record.id,
                payload: { title: record.title, description: record.description, isActive: checked },
              })
            }
          />
        ),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: '文件大小',
        dataIndex: 'fileSize',
        key: 'fileSize',
        render: (value?: number) => (value ? `${(value / (1024 * 1024)).toFixed(2)} MB` : '--'),
      },
      {
        title: '操作',
        key: 'actions',
        render: (_, record) => (
          <Space size="middle">
            <Button type="link" href={record.filePath} target="_blank" rel="noreferrer">
              预览
            </Button>
            <Popconfirm
              title="确认删除此视频？"
              onConfirm={() => deleteMutation.mutate(record.id)}
              okText="删除"
              cancelText="取消"
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [deleteMutation, updateMutation]
  );

  const dataSource = (data?.items ?? []).map((item) => ({ ...item, key: item.id }));

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedFile) {
        message.warning('请先选择视频文件');
        return;
      }

      setUploadProgress(0);
      await createMutation.mutateAsync({
        title: values.title,
        description: values.description,
        file: selectedFile,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Input.Search
          placeholder="搜索视频标题"
          allowClear
          onSearch={(value) => {
            setPage(1);
            setSearch(value);
          }}
          style={{ width: 260 }}
        />
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          上传视频
        </Button>
      </div>
      <Table
        loading={isLoading}
        columns={columns}
        dataSource={dataSource}
        pagination={{
          current: page,
          pageSize,
          total: data?.totalCount,
          onChange: (newPage, newSize) => {
            setPage(newPage);
            setPageSize(newSize);
          },
        }}
        rowKey="id"
      />

      <Modal
        title="上传视频"
        open={isModalOpen}
        onCancel={() => {
          if (!createMutation.isPending) {
            setIsModalOpen(false);
            setUploadProgress(0);
            form.resetFields();
            setSelectedFile(null);
          }
        }}
        onOk={handleUpload}
        confirmLoading={createMutation.isPending}
        maskClosable={!createMutation.isPending}
        closable={!createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="视频标题" rules={[{ required: true, message: '请输入视频标题' }]}>
            <Input placeholder="请输入视频标题" disabled={createMutation.isPending} />
          </Form.Item>
          <Form.Item name="description" label="视频描述">
            <Input.TextArea rows={3} placeholder="请输入描述（可选）" disabled={createMutation.isPending} />
          </Form.Item>
          <Form.Item label="视频文件" required>
            <Upload
              beforeUpload={(file) => {
                setSelectedFile(file);
                return false;
              }}
              maxCount={1}
              accept="video/mp4"
              disabled={createMutation.isPending}
            >
              <Button icon={<UploadOutlined />} disabled={createMutation.isPending}>
                选择 MP4 文件
              </Button>
            </Upload>
            {selectedFile && (
              <Tag color="blue" className="mt-2">
                {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </Tag>
            )}
          </Form.Item>
          {createMutation.isPending && uploadProgress > 0 && (
            <Form.Item>
              <Progress percent={uploadProgress} status="active" />
              <p className="text-sm text-gray-500 mt-2">正在上传，请勿关闭页面...</p>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};
