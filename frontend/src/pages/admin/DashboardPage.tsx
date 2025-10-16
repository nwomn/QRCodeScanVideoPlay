import { Card, Col, Row, Statistic } from 'antd';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

interface DashboardStats {
  videoCount: number;
  qrCodeCount: number;
  scanCount: number;
  playCount: number;
}

export const DashboardPage = () => {
  const { data } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/stats/summary');
      return response.data;
    },
    staleTime: 1000 * 60,
  });

  return (
    <div className="space-y-6">
      <Row gutter={16}>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic title="视频数量" value={data?.videoCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic title="二维码数量" value={data?.qrCodeCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic title="累计扫码" value={data?.scanCount ?? 0} />
          </Card>
        </Col>
        <Col xs={24} md={12} lg={6}>
          <Card>
            <Statistic title="播放次数" value={data?.playCount ?? 0} />
          </Card>
        </Col>
      </Row>
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
