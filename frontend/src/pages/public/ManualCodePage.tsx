import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveQrCode } from '../../services/public';

export const ManualCodePage = () => {
  useEffect(() => {
    document.title = '手动输入 - QR视频播放系统';
  }, []);

  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim()) {
      setError('请输入二维码编码');
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const result = await resolveQrCode(code.trim());
      navigate(`/play/${encodeURIComponent(result.qrCode.codeValue)}`, { state: result });
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询失败，请确认编码是否正确');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <button
        type="button"
        className="text-sm text-primary"
        onClick={() => navigate(-1)}
      >
        ← 返回扫码
      </button>
      <h1 className="mt-4 text-2xl font-semibold">手动输入二维码编码</h1>
      <p className="text-sm text-gray-600">适用于摄像头不可用或二维码损坏的情况。</p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium text-gray-700">
            二维码编码
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="w-full rounded-md border px-3 py-2 focus:border-primary focus:outline-none"
            placeholder="请输入编码"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {loading ? '查询中...' : '确定'}
        </button>
      </form>
    </div>
  );
};
