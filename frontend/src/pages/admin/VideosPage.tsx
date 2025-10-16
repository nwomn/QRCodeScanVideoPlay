import { useMemo, useState } from 'react';
import { Button, Form, Input, Modal, Space, Switch, Table, Tag, Upload, message } from 'antd';
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
      form.resetFields();
      setSelectedFile(null);
      void queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (err: unknown) => {
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
            <a href={record.filePath} target="_blank" rel="noreferrer" className="text-primary">
              预览
            </a>
            <a
              className="text-red-500"
              onClick={() => {
                Modal.confirm({
                  title: '确认删除此视频？',
                  centered: true,
                  onOk: () => deleteMutation.mutate(record.id),
                });
              }}
            >
              删除
            </a>
          </Space>
        ),
      },
    ],
    [deleteMutation, updateMutation]
  );

  const dataSource = (data?.items ?? []).map((item) => ({ ...item, key: item.id }));

  const handleUpload = () => {
    form
      .validateFields()
      .then((values: { title: string; description?: string }) => {
        if (!selectedFile) {
          message.warning('请先选择视频文件');
          return;
        }
        createMutation.mutate({ title: values.title, description: values.description, file: selectedFile });
      })
      .catch(() => undefined);
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
          setIsModalOpen(false);
          form.resetFields();
          setSelectedFile(null);
        }}
        onOk={handleUpload}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="视频标题" rules={[{ required: true, message: '请输入视频标题' }]}> 
            <Input placeholder="请输入视频标题" />
          </Form.Item>
          <Form.Item name="description" label="视频描述">
            <Input.TextArea rows={3} placeholder="请输入描述（可选）" />
          </Form.Item>
          <Form.Item label="视频文件" required>
            <Upload
              beforeUpload={(file) => {
                setSelectedFile(file);
                return false;
              }}
              maxCount={1}
              accept="video/mp4"
            >
              <Button icon={<UploadOutlined />}>选择 MP4 文件</Button>
            </Upload>
            {selectedFile && (
              <Tag color="blue" className="mt-2">
                {selectedFile.name}
              </Tag>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
