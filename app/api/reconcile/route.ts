import { NextRequest, NextResponse } from 'next/server';
import { insertTransaction, fetchTransactions, deleteTransaction } from '../../../services/reconcile';
import { supabase } from '../../../utils/supabaseClient';

async function getUserFromRequest(req: NextRequest) {
  // look for bearer token forwarded from the client
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.split(' ')[1] || '';
  if (!token) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) throw error;
  return user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rows = await fetchTransactions(user.id);
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: err.status || 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    // the body is expected to contain game, action, amount, image, date
    const toInsert = { ...body, user_id: user.id };
    const inserted = await insertTransaction(toInsert);
    return NextResponse.json(inserted);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: err.status || 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }
    await deleteTransaction(Number(id), user.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: err.status || 500 });
  }
}
