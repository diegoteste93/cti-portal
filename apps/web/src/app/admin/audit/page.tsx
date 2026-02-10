'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import { isAdmin } from '@/lib/auth';

interface AuditEntry {
  id: string;
  action: string;
  objectType: string;
  objectId?: string;
  timestamp: string;
  actor?: { name: string; email: string };
  diffJson?: Record<string, unknown>;
}

export default function AuditPage() {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchLogs(1);
  }, [user]);

  const fetchLogs = async (p: number) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/audit?page=${p}&limit=50`);
      setLogs(res.data);
      setTotal(res.total);
      setPage(res.page);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) return null;
  if (!isAdmin(user)) return <div className="p-8 text-red-400">Access denied</div>;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <h2 className="text-2xl font-bold mb-6">Audit Log ({total})</h2>
        <div className="space-y-2">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="card py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge bg-gray-700 text-gray-300 text-xs">{log.action}</span>
                    <span className="text-sm text-gray-400">{log.objectType}</span>
                    {log.objectId && <span className="text-xs text-gray-600 font-mono">{log.objectId.slice(0, 8)}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {log.actor?.name || log.actor?.email || 'System'} &middot; {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
                {log.diffJson && (
                  <pre className="text-[10px] text-gray-600 max-w-xs truncate">{JSON.stringify(log.diffJson)}</pre>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
