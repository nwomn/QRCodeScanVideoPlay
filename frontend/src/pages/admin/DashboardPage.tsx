import { Card, Col, Row, Statistic } from 'antd';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface DashboardStats {
  videoCount: number;
  qrCodeCount: number;
  scanCount: number;
  playCount: number;
}

export const DashboardPage = () => {
  useEffect(() => {
    document.title = '概览 - QR视频播放系统';
  }, []);

  const { data, isLoading, isError, error } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/stats/summary');
      return response.data;
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 30, // 每30秒自动刷新一次
  });

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col xs={24} md={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="视频数量" value={data?.videoCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="二维码数量" value={data?.qrCodeCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="累计扫码" value={data?.scanCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card loading={isLoading}>
            <Statistic title="播放次数" value={data?.playCount ?? 0} />
          </Card>
        </Col>
      </Row>
      {isError && (
        <Card className="border-red-200 bg-red-50">
          <p className="text-red-600 text-sm">
            加载统计数据失败: {error instanceof Error ? error.message : '未知错误'}
          </p>
        </Card>
      )}
      <Card title="使用指南">
        <ul className="list-disc space-y-2 pl-6 text-sm text-gray-600">
          <li>在“视频管理”上传或更新视频资源，系统会自动生成播放地址。</li>
          <li>在“二维码管理”创建二维码并下载图片，打印后即可投入使用。</li>
          <li>“统计日志”可查看扫码/播放情况，帮助分析场地运营表现。</li>
        </ul>
      </Card>
    </div>
  );
};
