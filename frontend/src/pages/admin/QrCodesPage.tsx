import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [videoSearchText, setVideoSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecord, setEditingRecord] = useState<QrCodeRecord | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // Debounce utility
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const createDebouncedCallback = useCallback((callback: (value: string) => void, delay: number) => {
    return (value: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        callback(value);
      }, delay);
    };
  }, []);

  const { data, isLoading } = useQuery<PagedResult<QrCodeDto>>({
    queryKey: ['qrcodes', page, pageSize, videoFilter],
    queryFn: () => fetchQrCodes({ page, pageSize, videoId: videoFilter }),
    placeholderData: (previous) => previous,
  });

  const { data: videoOptionsResult, isLoading: isLoadingVideos } = useQuery<PagedResult<VideoDto>>({
    queryKey: ['video-options', videoSearchText],
    queryFn: () => fetchVideoOptions({ search: videoSearchText, pageSize: 50 }),
    placeholderData: (previous) => previous,
  });

  const videoOptions = videoOptionsResult?.items ?? [];

  const handleVideoSearch = useCallback((value: string) => {
    setVideoSearchText(value);
  }, []);

  const debouncedVideoSearch = createDebouncedCallback(handleVideoSearch, 300);

  const createMutation = useMutation({
    mutationFn: createQrCode,
    onSuccess: () => {
      message.success('创建成功');
      handleModalClose();
      void queryClient.invalidateQueries({ queryKey: ['qrcodes'] });
    },
    onError: (error: unknown) => {
      message.error(error instanceof Error ? error.message : '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { videoId?: string; isActive: boolean; description?: string } }) =>
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

  const handleEdit = (record: QrCodeRecord) => {
    setIsEditMode(true);
    setEditingRecord(record);
    form.setFieldsValue({
      videoId: record.videoId,
      description: record.description,
      isActive: record.isActive,
    });
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then((values: { videoId: string; description?: string; isActive: boolean }) => {
        if (isEditMode && editingRecord) {
          updateMutation.mutate(
            { id: editingRecord.id, payload: values },
            {
              onSuccess: () => {
                handleModalClose();
              },
            }
          );
        } else {
          createMutation.mutate(values);
        }
      })
      .catch(() => undefined);
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
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
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
          placeholder="搜索视频名称进行筛选"
          options={videoOptions?.map((video) => ({ label: video.title, value: video.id }))}
          onChange={(value) => {
            setVideoFilter(value);
            setPage(1);
          }}
          style={{ width: 240 }}
          showSearch
          onSearch={debouncedVideoSearch}
          filterOption={false}
          virtual={true}
          listHeight={400}
          loading={isLoadingVideos}
          notFoundContent={isLoadingVideos ? '搜索中...' : videoSearchText ? '未找到匹配的视频' : '请输入视频名称搜索'}
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
        title={isEditMode ? '编辑二维码' : '新建二维码'}
        open={isModalOpen}
        onCancel={handleModalClose}
        onOk={handleModalOk}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
          <Form.Item name="videoId" label="关联视频" rules={[{ required: true, message: '请选择视频' }]}>
            <Select
              placeholder="搜索并选择视频"
              options={videoOptions?.map((video) => ({ label: video.title, value: video.id }))}
              showSearch
              onSearch={debouncedVideoSearch}
              filterOption={false}
              virtual={true}
              listHeight={400}
              loading={isLoadingVideos}
              notFoundContent={isLoadingVideos ? '搜索中...' : videoSearchText ? '未找到匹配的视频' : '请输入视频名称搜索'}
            />
          </Form.Item>
          <Form.Item name="description" label="备注">
            <Input.TextArea rows={3} placeholder="可填写放置位置等信息" />
          </Form.Item>
          <Form.Item name="isActive" label="是否启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
