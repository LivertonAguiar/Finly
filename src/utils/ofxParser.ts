export interface OFXTransaction {
  fitid: string;
  type: 'DEBIT' | 'CREDIT' | 'OTHER';
  amount: number;
  date: string;
  memo: string;
}

export function parseOFX(content: string): OFXTransaction[] {
  const transactions: OFXTransaction[] = [];
  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match;

  while ((match = stmtTrnRegex.exec(content)) !== null) {
    const block = match[1];
    const typeMatch = block.match(/<TRNTYPE>(.*?)(\r?\n|<)/i);
    const dateMatch = block.match(/<DTPOSTED>(.*?)(\r?\n|<)/i);
    const amountMatch = block.match(/<TRNAMT>(.*?)(\r?\n|<)/i);
    const fitidMatch = block.match(/<FITID>(.*?)(\r?\n|<)/i);
    const memoMatch = block.match(/<MEMO>(.*?)(\r?\n|<)/i) || block.match(/<NAME>(.*?)(\r?\n|<)/i);

    const typeStr = typeMatch ? typeMatch[1].trim().toUpperCase() : 'OTHER';
    const fitid = fitidMatch ? fitidMatch[1].trim() : `ofx-${Math.random()}`;
    const rawAmount = amountMatch ? parseFloat(amountMatch[1].trim().replace(',', '.')) : 0;
    const memo = memoMatch ? memoMatch[1].trim() : 'Transação OFX';

    let dateStr = new Date().toISOString().split('T')[0];
    if (dateMatch && dateMatch[1].trim().length >= 8) {
      const d = dateMatch[1].trim();
      const year = d.substring(0, 4);
      const month = d.substring(4, 6);
      const day = d.substring(6, 8);
      dateStr = `${year}-${month}-${day}`;
    }

    transactions.push({
      fitid,
      type: typeStr === 'CREDIT' ? 'CREDIT' : 'DEBIT',
      amount: Math.abs(rawAmount),
      date: dateStr,
      memo,
    });
  }

  return transactions;
}