'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { useAuth } from '../../../context/SupabaseAuthProvider';

const LEAD_AREA_TYPES = ['Market'];
const STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
  'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
  'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
];

export default function NewLeadRequestPage() {
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState({
    lead_request_type: '',
    lead_area_type: '',
    dealer_code: '',
    state: '',
    lead_area_requested: '',
    date_needed_by: '',
    notes: '',
  });
  const [requestTypes, setRequestTypes] = useState<{ id: number; name: string }[]>([]);
  const [fetchingTypes, setFetchingTypes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchRequestTypes = async () => {
      setFetchingTypes(true);
      const { data, error } = await supabase.from('request_types').select('id, name').order('id');
      if (error) setError(error.message);
      else setRequestTypes(data || []);
      setFetchingTypes(false);
    };
    fetchRequestTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    // Validation
    if (!formData.lead_request_type || !formData.lead_area_type || !formData.state || !formData.lead_area_requested || !formData.date_needed_by || !formData.notes) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!user) {
      setError('You must be logged in to submit a request.');
      return;
    }
    setSubmitting(true);
    const { error: insertError } = await supabase.from('lead_requests').insert([
      {
        user_id: user.id,
        request_type_id: null, // Not using dynamic request_types for this form
        notes: formData.notes,
        state: formData.state,
        dealer_code: formData.dealer_code,
        date_needed_by: formData.date_needed_by,
        lead_area_type: formData.lead_area_type,
        lead_request_type: formData.lead_request_type,
        lead_area_requested: formData.lead_area_requested,
        status: 'draft',
      },
    ]);
    setSubmitting(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(true);
      setFormData({
        lead_request_type: '',
        lead_area_type: '',
        dealer_code: '',
        state: '',
        lead_area_requested: '',
        date_needed_by: '',
        notes: '',
      });
    }
  };

  if (loading || fetchingTypes) return <div>Loading...</div>;
  if (!user) return <div>Please log in to submit a lead request.</div>;

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto' }}>
      <h1>New Lead Request</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>Lead request submitted!</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label>
          Lead Request Type<span style={{ color: 'red' }}> *</span>
          <select name="lead_request_type" value={formData.lead_request_type} onChange={handleChange} required>
            <option value="" disabled>Select type...</option>
            {requestTypes.map(type => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>
        </label>
        <label>
          Lead Area Type<span style={{ color: 'red' }}> *</span>
          <select name="lead_area_type" value={formData.lead_area_type} onChange={handleChange} required>
            <option value="" disabled>Select area type...</option>
            {LEAD_AREA_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          AT&T Dealer Code
          <input name="dealer_code" value={formData.dealer_code} onChange={handleChange} placeholder="Enter dealer code" />
        </label>
        <label>
          State<span style={{ color: 'red' }}> *</span>
          <select name="state" value={formData.state} onChange={handleChange} required>
            <option value="" disabled>Choose state...</option>
            {STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </label>
        <label>
          Lead Area Requested<span style={{ color: 'red' }}> *</span>
          <input name="lead_area_requested" value={formData.lead_area_requested} onChange={handleChange} placeholder="Market Ex. Venice, California | Zip Ex. 90291" required />
        </label>
        <label>
          Date Needed By<span style={{ color: 'red' }}> *</span>
          <input type="date" name="date_needed_by" value={formData.date_needed_by} onChange={handleChange} required />
        </label>
        <label>
          Notes<span style={{ color: 'red' }}> *</span>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Please include: Reason for request, zip codes requested, and ICL Name"
            required
          />
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
      </form>
    </div>
  );
} 