import { useState, useEffect } from 'react';
import { Tabs, Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { fetchPlayLogs, fetchScanLogs, type PlayLogDto, type ScanLogDto } from '../../services/logs';
import type { PagedResult } from '../../services/videos';

export const LogsPage = () => {
  useEffect(() => {
    document.title = '统计日志 - QR视频播放系统';
  }, []);

  const [scanPage, setScanPage] = useState(1);
  const [playPage, setPlayPage] = useState(1);
  const pageSize = 20;

  const scanQuery = useQuery<PagedResult<ScanLogDto>>({
    queryKey: ['scanLogs', scanPage],
    queryFn: () => fetchScanLogs({ page: scanPage, pageSize }),
    placeholderData: (previous) => previous,
  });

  const playQuery = useQuery<PagedResult<PlayLogDto>>({
    queryKey: ['playLogs', playPage],
    queryFn: () => fetchPlayLogs({ page: playPage, pageSize }),
    placeholderData: (previous) => previous,
  });

  const scanColumns: ColumnsType<ScanLogDto & { key: string }> = [
    {
      title: '二维码编码',
      dataIndex: 'codeValue',
      key: 'codeValue',
    },
    {
      title: '扫码时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '结果',
      dataIndex: 'success',
      key: 'success',
      render: (value: boolean, record) => (value ? '成功' : `失败：${record.failReason ?? '未知'}`),
    },
    {
      title: '客户端信息',
      dataIndex: 'clientInfo',
      key: 'clientInfo',
      ellipsis: true,
      render: (value?: string) => value ?? '--',
    },
  ];

  const playColumns: ColumnsType<PlayLogDto & { key: string }> = [
    {
      title: '视频',
      dataIndex: 'videoTitle',
      key: 'videoTitle',
    },
    {
      title: '播放时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '观看时长',
      dataIndex: 'watchedDuration',
      key: 'watchedDuration',
      render: (value?: string | null) => value ?? '--',
    },
    {
      title: '是否完成',
      dataIndex: 'completed',
      key: 'completed',
      render: (value: boolean) => (value ? '是' : '否'),
    },
    {
      title: '客户端信息',
      dataIndex: 'clientInfo',
      key: 'clientInfo',
      ellipsis: true,
      render: (value?: string) => value ?? '--',
    },
  ];

  return (
    <Tabs
      items={[
        {
          key: 'scans',
          label: '扫码日志',
          children: (
            <Table
              loading={scanQuery.isLoading}
              columns={scanColumns}
              dataSource={(scanQuery.data?.items ?? []).map((item) => ({ ...item, key: item.id }))}
              pagination={{
                current: scanPage,
                pageSize,
                total: scanQuery.data?.totalCount,
                onChange: setScanPage,
              }}
              rowKey="id"
            />
          ),
        },
        {
          key: 'plays',
          label: '播放日志',
          children: (
            <Table
              loading={playQuery.isLoading}
              columns={playColumns}
              dataSource={(playQuery.data?.items ?? []).map((item) => ({ ...item, key: item.id }))}
              pagination={{
                current: playPage,
                pageSize,
                total: playQuery.data?.totalCount,
                onChange: setPlayPage,
              }}
              rowKey="id"
            />
          ),
        },
      ]}
    />
  );
};
