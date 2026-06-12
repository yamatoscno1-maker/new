import { Expense, CardSource } from '../types';
import { parseAmexEmail, parseUpsiderEmail } from './emailParser';

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

async function gmailFetch(path: string, token: string) {
  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail API error: ${res.status}`);
  return res.json();
}

async function getMessageBody(messageId: string, token: string): Promise<string> {
  const msg = await gmailFetch(`/messages/${messageId}?format=full`, token);
  const parts = msg.payload?.parts ?? [];
  const textPart = parts.find((p: any) => p.mimeType === 'text/plain') ?? msg.payload;
  const data = textPart?.body?.data ?? '';
  return atob(data.replace(/-/g, '+').replace(/_/g, '/'));
}

export async function fetchExpenses(token: string): Promise<Expense[]> {
  const queries = [
    { q: 'from:americanexpress (ご利用 OR 利用通知)', source: 'amex' as CardSource },
    { q: 'from:up-sider.com (決済 OR ご利用 OR 利用)', source: 'upsider' as CardSource },
    { q: 'from:notice@up-sider.com', source: 'upsider' as CardSource },
    { q: 'subject:[UPSIDER] 決済', source: 'upsider' as CardSource },
  ];

  const threadIdsSeen = new Set<string>();
  const expenses: Expense[] = [];

  for (const { q, source } of queries) {
    const data = await gmailFetch(`/threads?q=${encodeURIComponent(q)}&maxResults=50`, token);
    const threads: any[] = data.threads ?? [];

    for (const thread of threads) {
      if (threadIdsSeen.has(thread.id)) continue;
      threadIdsSeen.add(thread.id);

      const detail = await gmailFetch(`/threads/${thread.id}?format=full`, token);
      const messages: any[] = detail.messages ?? [];

      for (const msg of messages) {
        const headers: any[] = msg.payload?.headers ?? [];
        const subject = headers.find((h: any) => h.name === 'Subject')?.value ?? '';
        const dateHeader = headers.find((h: any) => h.name === 'Date')?.value ?? '';

        const parts = msg.payload?.parts ?? [];
        const textPart = parts.find((p: any) => p.mimeType === 'text/plain') ?? msg.payload;
        const rawData = textPart?.body?.data ?? '';
        let body = '';
        try {
          body = atob(rawData.replace(/-/g, '+').replace(/_/g, '/'));
        } catch {
          body = msg.snippet ?? '';
        }

        const parsed = source === 'amex'
          ? parseAmexEmail(subject, body, dateHeader)
          : parseUpsiderEmail(subject, body, dateHeader);

        if (parsed) {
          expenses.push({
            id: msg.id,
            gmailThreadId: thread.id,
            rawSubject: subject,
            source,
            business: 'unassigned',
            ...parsed,
          });
        }
      }
    }
  }

  return expenses;
}
