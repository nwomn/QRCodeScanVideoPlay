import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../../services/auth';
import { useAuthStore } from '../../store/auth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const loginStore = useAuthStore((state) => state.login);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const response = await login(values);
      loginStore(response.token, response.username, true);
      message.success('登录成功');
      const redirectTo = (location.state as { from?: { pathname: string } } | undefined)?.from?.pathname ?? '/admin';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败，请检查账号密码');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <Card className="w-full max-w-sm shadow-lg">
        <Typography.Title level={3} className="text-center">
          管理后台登录
        </Typography.Title>
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}> 
            <Input prefix={<UserOutlined />} placeholder="请输入账号" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}> 
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
