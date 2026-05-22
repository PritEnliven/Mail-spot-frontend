import type { Email } from '@models/Email';
import { getSingleEmailService } from '@services/email/emailService';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EmailDetail from './EmailDetail';

const EmailDetailPage = () => {
  const { boxName, messageId } = useParams();
  const [email, setEmail] = useState<Email | null>(null);

  useEffect(() => {
    if (!boxName || !messageId) return;

    const fetchEmail = async () => {
      const payload = {
        current_active_box: boxName,
        messageId: messageId,
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
