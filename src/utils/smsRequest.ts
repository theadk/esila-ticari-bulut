export const sendSMS = async (settings: any, receivers: string[], messageText: string) => {
  const { sms_api_key, sms_api_hash, sms_sender_id } = settings;
  if (!sms_api_key || !sms_api_hash || !sms_sender_id) {
    throw new Error('Lütfen Ayarlar sayfasından SMS API bilgilerini (Key, Hash ve Başlık) doldurunuz.');
  }

  const cleanReceivers = receivers.map(r => r.replace(/[^0-9]/g, '')).filter(r => r.length >= 10);
  if (cleanReceivers.length === 0) {
    throw new Error("Geçerli bir telefon numarası bulunamadı.");
  }

  const payload = {
    request: {
      authentication: {
        key: sms_api_key,
        hash: sms_api_hash
      },
      order: {
        sender: sms_sender_id,
        sendDateTime: [],
        message: {
          text: messageText,
          receivers: {
            receiver: cleanReceivers
          }
        }
      }
    }
  };

  const response = await fetch('/api/send-sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SMS gönderilirken bir hata oluştu: ${errorText}`);
  }

  const result = await response.json();
  
  if (result?.response?.status?.code !== 200 && result?.response?.status?.code !== '200') {
     throw new Error(result?.response?.status?.message || 'SMS gönderilirken bir hata oluştu.');
  }
  return result;
};
