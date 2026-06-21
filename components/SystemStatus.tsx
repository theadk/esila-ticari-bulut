import React, { useEffect, useState } from 'react';
import { Activity, Cpu, Database, Server } from 'lucide-react';

interface SystemStatusData {
  db: {
    status: string;
    responseTime: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercentage: number;
  };
  cpu: {
    cores: number;
    model: string;
    loadAvgs: number[];
  };
  uptime: number;
}

export const SystemStatus: React.FC = () => {
  const [status, setStatus] = useState<SystemStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/system-status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error("Failed to fetch status", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !status) {
    return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
  }

  if (!status) {
    return <div className="p-8 text-center text-red-500">Sistem durumu alınamadı.</div>;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}g ${h}s ${m}d`;
  };

  return (
    <div className="space-y-6 animate-fade-in sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Sistem Durumu Kontrolü</h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-emerald-600">Canlı Bağlantı</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Status */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-emerald-600">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Database size={24} />
            </div>
            <h4 className="font-medium text-gray-900">Veritabanı</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Durum:</span>
              <span className={`font-semibold ${status.db.status === 'connected' ? 'text-emerald-600' : 'text-red-500'}`}>
                {status.db.status === 'connected' ? 'Bağlı' : 'Bağlantı Hatası'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gecikme:</span>
              <span className="font-semibold text-gray-700">{status.db.responseTime} ms</span>
            </div>
          </div>
        </div>

        {/* CPU Status */}
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-blue-600">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Cpu size={24} />
            </div>
            <h4 className="font-medium text-gray-900">İşlemci (CPU)</h4>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Çekirdek:</span>
              <span className="font-semibold text-gray-700">{status.cpu.cores} Çekirdek</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Model:</span>
              <span className="text-gray-700 text-right truncate max-w-[200px]" title={status.cpu.model}>
                {status.cpu.model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Yük (1dk):</span>
              <span className="font-semibold text-gray-700">{status.cpu.loadAvgs[0]?.toFixed(2) || 0}</span>
            </div>
          </div>
        </div>

        {/* Memory Status */}
        <div className="bg-white border rounded-xl p-5 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-4 text-indigo-600">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Activity size={24} />
            </div>
            <h4 className="font-medium text-gray-900">Sistem Belleği (RAM)</h4>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">
                Kullanılan: <span className="font-semibold text-gray-900">{formatBytes(status.memory.used)}</span> / {formatBytes(status.memory.total)}
              </span>
              <span className="font-semibold text-indigo-600">{status.memory.usagePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${
                  status.memory.usagePercentage > 85 ? 'bg-red-500' : 
                  status.memory.usagePercentage > 60 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${status.memory.usagePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Server Info */}
        <div className="bg-white border rounded-xl p-5 shadow-sm md:col-span-2">
          <div className="flex items-center gap-3 mb-4 text-purple-600">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Server size={24} />
            </div>
            <h4 className="font-medium text-gray-900">Sunucu Bilgisi</h4>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Açık Kalma Süresi (Uptime):</span>
            <span className="font-semibold text-gray-700">{formatUptime(status.uptime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
