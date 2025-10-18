import { useState, useEffect } from 'react';
import { Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createQrCode,
  deleteQrCode,
  downloadQrCodeImage,
  fetchQrCodes,
  fetchVideoOptions,
  updateQrCode,
} from '../../services/qrcodes';
import type { QrCodeDto } from '../../services/qrcodes';
import type { PagedResult, VideoDto } from '../../services/videos';

interface QrCodeRecord extends QrCodeDto {
  key: string;
  description?: string;
}

export const QrCodesPage = () => {
  useEffect(() => {
    document.title = '二维码管理 - QR视频播放系统';
  }, []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [videoFilter, setVideoFilter] = useState<string>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PagedResult<QrCodeDto>>({
    queryKey: ['qrcodes', page, pageSize, videoFilter],
    queryFn: () => fetchQrCodes({ page, pageSize, videoId: videoFilter }),
    placeholderData: (previous) => previous,
  });

  const { data: videoOptions } = useQuery<VideoDto[]>({
    queryKey: ['video-options'],
    queryFn: fetchVideoOptions,
  });

  const createMutation = useMutation({
    mutationFn: createQrCode,
    onSuccess: () => {
      message.success('创建成功');
      setIsModalOpen(false);
      form.resetFields();
      void queryClient.invalidateQueries({ queryKey: ['qrcodes'] });
    },
    onError: (error: unknown) => {
      message.error(error instanceof Error ? error.message : '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { isActive: boolean; description?: string } }) =>
      updateQrCode(id, payload),
    onSuccess: () => {
      message.success('更新成功');
      void queryClient.invalidateQueries({ queryKey: ['qrcodes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteQrCode,
    onSuccess: () => {
      message.success('删除成功');
      void queryClient.invalidateQueries({ queryKey: ['qrcodes'] });
    },
    onError: (error: unknown) => {
      message.error(error instanceof Error ? error.message : '删除失败');
    },
  });

  const handleDownload = async (id: string, code: string) => {
    try {
      const blob = await downloadQrCodeImage(id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `qrcode-${code}.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '下载失败');
    }
  };

  const columns: ColumnsType<QrCodeRecord> = [
    {
      title: '编码',
      dataIndex: 'codeValue',
      key: 'codeValue',
      render: (value: string) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: '关联视频',
      dataIndex: 'videoTitle',
      key: 'videoTitle',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (value: boolean, record) => (
        <Switch
          checked={value}
          onChange={(checked) =>
            updateMutation.mutate({ id: record.id, payload: { isActive: checked, description: record.description } })
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
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleDownload(record.id, record.codeValue)}>
            下载二维码
          </Button>
          <Popconfirm
            title="确认删除该二维码？"
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
  ];

  const dataSource = (data?.items ?? []).map((item) => ({ ...item, key: item.id }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select
          allowClear
          placeholder="按视频筛选"
          options={videoOptions?.map((video) => ({ label: video.title, value: video.id }))}
          onChange={(value) => {
            setVideoFilter(value);
            setPage(1);
          }}
          style={{ width: 240 }}
          showSearch
          optionFilterProp="label"
        />
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          新建二维码
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
        title="新建二维码"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={() => {
          form
            .validateFields()
            .then((values: { videoId: string; description?: string; isActive: boolean }) => {
              createMutation.mutate(values);
            })
            .catch(() => undefined);
        }}
        confirmLoading={createMutation.isPending}
      >
        <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
          <Form.Item name="videoId" label="关联视频" rules={[{ required: true, message: '请选择视频' }]}> 
            <Select
              placeholder="请选择视频"
              options={videoOptions?.map((video) => ({ label: video.title, value: video.id }))}
              showSearch
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item name="description" label="备注">
            <Input.TextArea rows={3} placeholder="可填写放置位置等信息" />
          </Form.Item>
          <Form.Item name="isActive" label="是否启用" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
