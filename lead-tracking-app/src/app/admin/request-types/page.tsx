'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../../context/SupabaseAuthProvider';

type RequestType = {
  id: number;
  name: string;
  description: string;
  fields: any[];
};

export default function AdminRequestTypesPage() {
  const { user, loading } = useAuth();
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{ id?: number; name: string; description: string; fields: any[] }>({ name: '', description: '', fields: [] });
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    const fetchRequestTypes = async () => {
      setFetching(true);
      const { data, error } = await supabase.from('request_types').select('*').order('id');
      if (error) setError(error.message);
      else setRequestTypes(data || []);
      setFetching(false);
    };
    fetchRequestTypes();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Name is required');
      return;
    }
    if (editingId) {
      // Edit
      const { error } = await supabase.from('request_types').update({ name: form.name, description: form.description, fields: form.fields }).eq('id', editingId);
      if (error) setError(error.message);
      else setRequestTypes(rts => rts.map(rt => rt.id === editingId ? { ...rt, ...form } : rt));
      setEditingId(null);
    } else {
      // Add
      const { data, error } = await supabase.from('request_types').insert([{ name: form.name, description: form.description, fields: form.fields }]).select().single();
      if (error) setError(error.message);
      else setRequestTypes(rts => [...rts, data]);
    }
    setForm({ name: '', description: '', fields: [] });
  };

  const handleEditClick = (rt: RequestType) => {
    setForm({ id: rt.id, name: rt.name, description: rt.description, fields: rt.fields });
    setEditingId(rt.id);
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('request_types').delete().eq('id', id);
    if (error) setError(error.message);
    else setRequestTypes(rts => rts.filter(rt => rt.id !== id));
    if (editingId === id) {
      setForm({ name: '', description: '', fields: [] });
      setEditingId(null);
    }
  };

  if (loading || fetching) return <div>Loading...</div>;
  if (!user || user.role !== 'admin') return <div>Access denied.</div>;

  return (
    <div>
      <h1>Manage Request Types</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleAddOrEdit} style={{ marginBottom: 24 }}>
        <input
          name="name"
          value={form.name}
          onChange={handleInputChange}
          placeholder="Name"
        />
        <textarea
          name="description"
          value={form.description}
          onChange={handleInputChange}
          placeholder="Description"
        />
        {/* For MVP, fields editing is not implemented. */}
        <button type="submit">{editingId ? 'Update' : 'Add'} Request Type</button>
        {editingId && <button type="button" onClick={() => { setForm({ name: '', description: '', fields: [] }); setEditingId(null); }}>Cancel</button>}
      </form>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requestTypes.map(rt => (
            <tr key={rt.id}>
              <td>{rt.name}</td>
              <td>{rt.description}</td>
              <td>
                <button onClick={() => handleEditClick(rt)}>Edit</button>
                <button onClick={() => handleDelete(rt.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 