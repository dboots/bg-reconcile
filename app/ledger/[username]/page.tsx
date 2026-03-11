import { fetchTransactions, ReconcileRow } from '@/services/reconcile';
import LedgerView from '@/components/LedgerView';

interface LedgerPageProps {
  params: {
    username: string;
  };
}

// server component will run on the server and can await data
export default async function LedgerPage({ params }: LedgerPageProps) {
  const { username } = params;

  // for now we're treating the username as the user_id placeholder
  let transactions: ReconcileRow[] = [];
  try {
    transactions = await fetchTransactions(username);
  } catch (err) {
    console.error('failed to load transactions', err);
  }

  return (
    <main className="p-4">
      <LedgerView transactions={transactions} username={username} />
    </main>
  );
}