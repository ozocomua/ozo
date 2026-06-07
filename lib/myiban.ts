export async function createPaymentLink(amount: number, orderId: string) {
  const response = await fetch("https://myiban.com.ua/api/v1/links", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.MYIBAN_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiver_name: process.env.MYIBAN_NAME,
      iban: process.env.MYIBAN_IBAN,
      receiver_code: process.env.MYIBAN_CODE,
      amount: amount,
      purpose: `Поповнення рахунку`,
      display: `OZO: Замовлення #${orderId}`
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error("MYIBAN_HTTP:", response.status, text.slice(0, 200));
    return undefined;
  }

  const result = (await response.json()) as { data?: { payment_url?: string } };
  return result.data?.payment_url;
}
