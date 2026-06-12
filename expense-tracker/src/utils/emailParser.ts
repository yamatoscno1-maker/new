interface ParsedExpense {
  date: string;
  amount: number;
  merchant: string;
}

function parseDate(raw: string): string {
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  // Japanese format: 2026年06月12日
  const jpMatch = raw.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (jpMatch) {
    return `${jpMatch[1]}-${jpMatch[2].padStart(2, '0')}-${jpMatch[3].padStart(2, '0')}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function parseAmount(text: string): number | null {
  // ¥1,234 or 1,234円 or ¥1234
  const patterns = [
    /[¥￥]([0-9,]+)/,
    /([0-9,]+)\s*円/,
    /金額[：:\s]*([0-9,]+)/,
    /amount[：:\s]*([0-9,]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = parseInt(m[1].replace(/,/g, ''), 10);
      if (!isNaN(n) && n > 0) return n;
    }
  }
  return null;
}

export function parseAmexEmail(subject: string, body: string, dateHeader: string): ParsedExpense | null {
  // Only process usage notifications, not points or payment reminders
  const isUsage = /ご利用|利用通知|カードご利用/.test(subject) && !/ポイント|お支払い/.test(subject);
  if (!isUsage) return null;

  const amount = parseAmount(body);
  if (!amount) return null;

  // Merchant: look for 加盟店 or 利用先
  const merchantMatch = body.match(/(?:加盟店|ご利用先|利用先)[名様]?[：:\s]*(.+)/);
  const merchant = merchantMatch ? merchantMatch[1].trim().split(/\s/)[0] : '不明';

  // Date from body or header
  const dateMatch = body.match(/(?:ご利用日|利用日)[時分：:\s]*(\d{4}年\d{1,2}月\d{1,2}日|\d{4}\/\d{2}\/\d{2})/);
  const date = dateMatch ? parseDate(dateMatch[1]) : parseDate(dateHeader);

  return { date, amount, merchant };
}

export function parseUpsiderEmail(subject: string, body: string, dateHeader: string): ParsedExpense | null {
  // UPSIDER sends card usage notifications
  const isUsage = /決済|ご利用|利用|カード/.test(subject);
  if (!isUsage) return null;

  const amount = parseAmount(body);
  if (!amount) return null;

  // Merchant
  const merchantMatch = body.match(/(?:加盟店|店舗|利用先|merchant)[名様]?[：:\s]*(.+)/i);
  const merchant = merchantMatch ? merchantMatch[1].trim().split(/\s/)[0] : '不明';

  const dateMatch = body.match(/(\d{4}年\d{1,2}月\d{1,2}日|\d{4}\/\d{2}\/\d{2}|\d{4}-\d{2}-\d{2})/);
  const date = dateMatch ? parseDate(dateMatch[1]) : parseDate(dateHeader);

  return { date, amount, merchant };
}
