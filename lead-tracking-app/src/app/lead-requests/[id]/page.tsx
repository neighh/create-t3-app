'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../../context/SupabaseAuthProvider';

type LeadRequest = {
  id: number;
  user_id: string;
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
  updated_at: string;
};

type StatusHistory = {
  id: number;
  status: string;
  changed_by: string;
  changed_at: string;
  user_email?: string;
};

type RequestType = {
  id: number;
  name: string;
};

const STATUS_OPTIONS = [
  'draft',
  'submitted',
  'approved',
  'visible_in_salesforce',
  'rejected',
  'completed',
];

export default function LeadRequestDetailPage() {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const id = Number(params?.id);
  const [leadRequest, setLeadRequest] = useState<LeadRequest | null>(null);
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [history, setHistory] = useState<StatusHistory[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    const fetchData = async () => {
      setFetching(true);
      const { data: req, error: reqError } = await supabase.from('lead_requests').select('*').eq('id', id).single();
      if (reqError) { setError(reqError.message); setFetching(false); return; }
      setLeadRequest(req);
      setNewStatus(req.status);
      const { data: type } = await supabase.from('request_types').select('id, name').eq('id', req.request_type_id).single();
      setRequestType(type);
      const { data: hist } = await supabase
        .from('lead_request_status_history')
        .select('*, users(email)')
        .eq('lead_request_id', id)
        .order('changed_at', { ascending: false });
      setHistory((hist || []).map(h => ({ ...h, user_email: h.users?.email })));
      setFetching(false);
    };
    fetchData();
  }, [user, id, success]);

  const canUpdateStatus = user && (user.role === 'admin' || user.role === 'sidcorp');

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewStatus(e.target.value);
  };

  const handleUpdateStatus = async () => {
    if (!leadRequest || !user) return;
    setUpdating(true);
    setError(null);
    setSuccess(false);
    // Update lead_requests table
    const { error: updateError } = await supabase
      .from('lead_requests')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', leadRequest.id);
    if (updateError) { setError(updateError.message); setUpdating(false); return; }
    // Insert into status history
    const { error: histError } = await supabase
      .from('lead_request_status_history')
      .insert({
        lead_request_id: leadRequest.id,
        status: newStatus,
        changed_by: user.id,
        changed_at: new Date().toISOString(),
      });
    if (histError) { setError(histError.message); setUpdating(false); return; }
    setSuccess(true);
    setUpdating(false);
  };

  if (loading || fetching) return <div>Loading...</div>;
  if (!user) return <div>Please log in to view this request.</div>;
  if (!leadRequest) return <div>Request not found.</div>;
  if (user.role !== 'admin' && user.role !== 'sidcorp' && user.id !== leadRequest.user_id) return <div>Access denied.</div>;

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto' }}>
      <h1>Lead Request #{leadRequest.id}</h1>
      <div><b>Type:</b> {requestType?.name || 'Unknown'}</div>
      <div><b>Status:</b> {leadRequest.status}</div>
      <div><b>Created:</b> {new Date(leadRequest.created_at).toLocaleString()}</div>
      <div><b>Last Updated:</b> {new Date(leadRequest.updated_at).toLocaleString()}</div>
      <h3>Lead Request Details</h3>
      <ul>
        <li><b>Lead Request Type:</b> {leadRequest.lead_request_type}</li>
        <li><b>Lead Area Type:</b> {leadRequest.lead_area_type}</li>
        <li><b>Dealer Code:</b> {leadRequest.dealer_code}</li>
        <li><b>State:</b> {leadRequest.state}</li>
        <li><b>Lead Area Requested:</b> {leadRequest.lead_area_requested}</li>
        <li><b>Date Needed By:</b> {leadRequest.date_needed_by}</li>
        <li><b>Notes:</b> {leadRequest.notes}</li>
      </ul>
      {canUpdateStatus && (
        <div style={{ margin: '1rem 0' }}>
          <label>
            Update Status:
            <select value={newStatus} onChange={handleStatusChange}>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </label>
          <button onClick={handleUpdateStatus} disabled={updating || newStatus === leadRequest.status} style={{ marginLeft: 8 }}>
            {updating ? 'Updating...' : 'Update Status'}
          </button>
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {success && <div style={{ color: 'green' }}>Status updated!</div>}
        </div>
      )}
      <h3>Status History</h3>
      <table style={{ width: '100%', marginTop: 8 }}>
        <thead>
          <tr>
            <th>Status</th>
            <th>Changed By</th>
            <th>Changed At</th>
          </tr>
        </thead>
        <tbody>
          {history.map(h => (
            <tr key={h.id}>
              <td>{h.status}</td>
              <td>{h.user_email || h.changed_by}</td>
              <td>{new Date(h.changed_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 