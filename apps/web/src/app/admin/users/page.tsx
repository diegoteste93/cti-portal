'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Sidebar from '@/components/Sidebar';
import { api } from '@/lib/api';
import { isAdmin } from '@/lib/auth';

interface UserItem {
  id: string;
  email: string;
  name: string;
  picture?: string;
  status: string;
  role: string;
  groups: { id: string; name: string }[];
  createdAt: string;
}

export default function UsersPage() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    if (user) {
      Promise.all([
        api.get<any>('/users').then((r) => { setUsers(r.data); setTotal(r.total); }),
        api.get<any[]>('/groups').then(setGroups),
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  const handleRoleChange = async (id: string, role: string) => {
    await api.patch(`/users/${id}/role`, { role });
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
  };

  const handleStatusToggle = async (id: string, status: string) => {
    const newStatus = status === 'active' ? 'inactive' : 'active';
    await api.patch(`/users/${id}/status`, { status: newStatus });
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: newStatus } : u));
  };

  const handleGroupAssign = async (userId: string, groupId: string, add: boolean) => {
    const u = users.find((u) => u.id === userId);
    if (!u) return;
    const currentIds = u.groups.map((g) => g.id);
    const newIds = add ? [...currentIds, groupId] : currentIds.filter((id) => id !== groupId);
    const updated = await api.patch<UserItem>(`/users/${userId}/groups`, { groupIds: newIds });
    setUsers((prev) => prev.map((u) => u.id === userId ? updated : u));
  };

  if (authLoading || !user) return null;
  if (!isAdmin(user)) return <div className="p-8 text-red-400">Access denied</div>;

  const roleColors: Record<string, string> = {
    admin: 'badge-critical',
    cti_editor: 'badge-high',
    group_manager: 'badge-medium',
    viewer: 'badge-tag',
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <h2 className="text-2xl font-bold mb-6">Users ({total})</h2>
        <div className="space-y-3">
          {loading ? (
            <div className="text-gray-500">Loading...</div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {u.picture && <img src={u.picture} alt="" className="w-10 h-10 rounded-full" />}
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      <div className="flex gap-1 mt-1">
                        <span className={`badge ${roleColors[u.role] || ''}`}>{u.role}</span>
                        <span className={`badge ${u.status === 'active' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>{u.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="input-field w-auto text-xs"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="group_manager">Group Manager</option>
                      <option value="cti_editor">CTI Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button
                      onClick={() => handleStatusToggle(u.id, u.status)}
                      className={`text-xs px-3 py-1 rounded ${u.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                    >
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-2">Groups:</p>
                  <div className="flex flex-wrap gap-2">
                    {groups.map((g) => {
                      const isMember = u.groups.some((ug) => ug.id === g.id);
                      return (
                        <button
                          key={g.id}
                          onClick={() => handleGroupAssign(u.id, g.id, !isMember)}
                          className={`text-xs px-2 py-1 rounded border transition-colors ${
                            isMember ? 'bg-cti-accent/20 border-cti-accent text-cti-accent' : 'border-gray-700 text-gray-500 hover:border-gray-500'
                          }`}
                        >
                          {g.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
