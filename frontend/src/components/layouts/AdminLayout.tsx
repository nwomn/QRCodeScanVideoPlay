import { Layout, Menu, theme } from 'antd';
import type { MenuProps } from 'antd';
import {
  VideoCameraOutlined,
  QrcodeOutlined,
  BarChartOutlined,
  DashboardOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  {
    key: '/admin',
    icon: <DashboardOutlined />,
    label: '概览',
  },
  {
    key: '/admin/videos',
    icon: <VideoCameraOutlined />,
    label: '视频管理',
  },
  {
    key: '/admin/qrcodes',
    icon: <QrcodeOutlined />,
    label: '二维码管理',
  },
  {
    key: '/admin/logs',
    icon: <BarChartOutlined />,
    label: '统计日志',
  },
];

export const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const username = useAuthStore((state) => state.username);
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const selectedKeys = useMemo(() => {
    // Find the longest matching path to ensure correct menu item is selected
    let bestMatch: string | null = null;
    menuItems?.forEach((item) => {
      if (typeof item?.key === 'string' && location.pathname.startsWith(item.key)) {
        if (!bestMatch || item.key.length > bestMatch.length) {
          bestMatch = item.key;
        }
      }
    });
    return bestMatch ? [bestMatch] : [];
  }, [location.pathname]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0">
        <div className="h-16 flex items-center justify-center text-white font-semibold text-lg">
          后台管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={(info) => navigate(info.key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '1rem',
            paddingInline: '1.5rem',
          }}
        >
          <span className="text-sm text-gray-600">{username}</span>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login', { replace: true });
            }}
            className="inline-flex items-center gap-1 text-sm text-red-500"
          >
            <LogoutOutlined /> 退出
          </button>
        </Header>
        <Content style={{ margin: '24px 16px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 160px)',
              background: colorBgContainer,
              borderRadius: 8,
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};
