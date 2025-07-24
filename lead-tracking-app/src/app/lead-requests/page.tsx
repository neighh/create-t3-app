'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { useAuth } from '../../context/SupabaseAuthProvider';

type LeadRequest = {
  id: number;
  request_type_id: number;
  notes: string;
  state: string;
  dealer_code: string;
  date_needed_by: string;
  lead_area_type: string;
  lead_request_type: string;
  lead_area_requested: string;
  status: string;
  created_at: string;
  request_type?: { name: string };
};

type RequestType = {
  id: number;
  name: string;
};

export default function LeadRequestsListPage() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<LeadRequest[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchRequests = async () => {
      setFetching(true);
      let query = supabase
        .from('lead_requests')
        .select('id, request_type_id, notes, state, dealer_code, date_needed_by, lead_area_type, lead_request_type, lead_area_requested, status, created_at');
      if (user.role !== 'admin' && user.role !== 'sidcorp') {
        query = query.eq('user_id', user.id);
      }
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) setError(error.message);
      else setRequests(data || []);
      setFetching(false);
    };
    const fetchRequestTypes = async () => {
      const { data } = await supabase.from('request_types').select('id, name');
      setRequestTypes(data || []);
    };
    fetchRequests();
    fetchRequestTypes();
  }, [user]);

  const getTypeName = (id: number) => requestTypes.find(rt => rt.id === id)?.name || 'Unknown';

  if (loading || fetching) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view your lead requests.</div>;

  return (
    <div>
      <h1>My Lead Requests</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Created</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(r => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{getTypeName(r.request_type_id)}</td>
              <td>{r.status}</td>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td>{r.lead_request_type}</td>
              <td>{r.lead_area_type}</td>
              <td>{r.dealer_code}</td>
              <td>{r.state}</td>
              <td>{r.lead_area_requested}</td>
              <td>{r.date_needed_by}</td>
              <td>{r.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {requests.length === 0 && <div>No lead requests found.</div>}
    </div>
  );
} 