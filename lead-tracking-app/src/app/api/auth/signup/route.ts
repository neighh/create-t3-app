import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../utils/supabaseClient';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const { error } = await supabase.auth.signUp({ email, password });
  return NextResponse.json({ error });
} 