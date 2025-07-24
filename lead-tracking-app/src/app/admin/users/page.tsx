'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../../context/SupabaseAuthProvider';

const ROLES = ['icl_owner', 'sidcorp', 'admin'];

type UserRow = {
  id: string;
  email: string;
  role: string;
};

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchUsers = async () => {
      setFetching(true);
      const { data, error } = await supabase.from('users').select('id, email, role');
      if (error) setError(error.message);
      else setUsers(data || []);
      setFetching(false);
    };
    fetchUsers();
  }, [user]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
    if (error) {
      setError(error.message);
    } else {
      setUsers(users => users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
  };

  if (loading || fetching) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <div>Access denied.</div>;

  return (
    <div>
      <h1>Manage Users</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Change Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <select
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  disabled={u.id === user.id}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 