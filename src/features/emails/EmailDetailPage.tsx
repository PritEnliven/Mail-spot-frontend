import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EmailDetail from './EmailDetail';
import { getSingleEmailService } from '@services/email/emailService';
import type { Email } from '@models/Email';

const EmailDetailPage = () => {
  const { boxName, messageId } = useParams();
  const [email, setEmail] = useState<Email | null>(null);

  useEffect(() => {
    if (!boxName || !messageId) return;

    const fetchEmail = async () => {
      const decodedMessageId = decodeURIComponent(messageId);
      const payload = {
        current_active_box: boxName,
        messageId: decodedMessageId,
        isSearch: false,
      };

      const data = await getSingleEmailService(payload);
      setEmail(data.emailList);
    };

    fetchEmail();
  }, [boxName, messageId]);

  if (!email) return null;

  return (
    <EmailDetail
      email={email}
    />
  );
};

export default EmailDetailPage;
