export interface ExchangeRates {
  USD: number;
  EUR: number;
  GBP: number;
  [key: string]: number;
}

export const fetchExchangeRates = async (): Promise<ExchangeRates | null> => {
  try {
    const response = await fetch('/api/exchange-rates');
    if (!response.ok) throw new Error('API error');
    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const currencies = xmlDoc.getElementsByTagName('Currency');
    const rates: ExchangeRates = { USD: 0, EUR: 0, GBP: 0 };
    
    for (let i = 0; i < currencies.length; i++) {
      const code = currencies[i].getAttribute('CurrencyCode');
      const forexSelling = currencies[i].getElementsByTagName('ForexSelling')[0]?.textContent; // Selling is more common for business
      if (code && forexSelling && (code === 'USD' || code === 'EUR' || code === 'GBP')) {
        rates[code] = parseFloat(forexSelling);
      }
    }
    return rates;
  } catch (err) {
    console.error('Failed to fetch exchange rates', err);
    return null;
  }
};
