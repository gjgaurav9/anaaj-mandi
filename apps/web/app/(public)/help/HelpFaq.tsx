'use client';

import { Card, CardBody } from '@anaaj/ui';
import { useI18n } from '@/lib/i18n';

/** Tri-lingual FAQ. Kept inline (not in the global dictionary) since these are
 *  longer paragraphs specific to this page. */
const FAQ: Record<string, Array<{ q: string; a: string }>> = {
  en: [
    {
      q: 'How do I contact a broker?',
      a: 'Open any listing and tap “Connect on WhatsApp”. The broker’s number opens with a ready message.',
    },
    {
      q: 'What does the green ✓ Verified badge mean?',
      a: 'The broker submitted their GST / business proof and our team verified it. It does not guarantee a deal — always check ratings too.',
    },
    {
      q: 'A deal went wrong. What do I do?',
      a: 'Use the report form above. Pick the category (payment, quality, delivery) and describe it. Our team follows up and can mark the ticket resolved.',
    },
    {
      q: 'How are ratings calculated?',
      a: 'Buyers rate brokers on payment, quality match, delivery and ease of deal. The shown rating is the average of all four across all reviews.',
    },
  ],
  hi: [
    {
      q: 'ब्रोकर से कैसे संपर्क करें?',
      a: 'कोई भी लिस्टिंग खोलें और “व्हाट्सएप पर जुड़ें” दबाएँ। ब्रोकर का नंबर तैयार मैसेज के साथ खुलेगा।',
    },
    {
      q: 'हरा ✓ सत्यापित बैज क्या दर्शाता है?',
      a: 'ब्रोकर ने जीएसटी / व्यापार प्रमाण जमा किया और हमारी टीम ने उसे जाँचा। यह सौदे की गारंटी नहीं — रेटिंग भी देखें।',
    },
    {
      q: 'सौदे में गड़बड़ी हुई, क्या करें?',
      a: 'ऊपर दिए रिपोर्ट फ़ॉर्म का उपयोग करें। श्रेणी चुनें (भुगतान, क्वालिटी, डिलीवरी) और बताएं। हमारी टीम संपर्क करेगी।',
    },
    {
      q: 'रेटिंग कैसे बनती है?',
      a: 'खरीदार ब्रोकर को भुगतान, क्वालिटी, डिलीवरी और सौदे की आसानी पर रेट करते हैं। दिखाई गई रेटिंग इन चारों का औसत है।',
    },
  ],
  mr: [
    {
      q: 'ब्रोकरशी संपर्क कसा करायचा?',
      a: 'कोणतीही यादी उघडा आणि “व्हॉट्सअ‍ॅपवर संपर्क करा” दाबा. ब्रोकरचा नंबर तयार मेसेजसह उघडेल.',
    },
    {
      q: 'हिरवा ✓ पडताळणी बॅज म्हणजे काय?',
      a: 'ब्रोकरने जीएसटी / व्यवसाय पुरावा सादर केला आणि आमच्या टीमने पडताळला. ही व्यवहाराची हमी नाही — रेटिंगही पाहा.',
    },
    {
      q: 'व्यवहारात काही चूक झाली, काय करावे?',
      a: 'वरील अहवाल फॉर्म वापरा. श्रेणी निवडा (पेमेंट, क्वालिटी, डिलिव्हरी) आणि सांगा. आमची टीम संपर्क करेल.',
    },
    {
      q: 'रेटिंग कशी मोजली जाते?',
      a: 'खरेदीदार ब्रोकरला पेमेंट, क्वालिटी, डिलिव्हरी आणि व्यवहाराची सुलभता यावर रेट करतात. दाखवलेली रेटिंग या चारांची सरासरी आहे.',
    },
  ],
};

export function HelpFaq() {
  const { locale, t } = useI18n();
  const items = FAQ[locale] ?? FAQ.en ?? [];
  return (
    <Card>
      <CardBody className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
          {t('help.faq')}
        </h2>
        <ul className="space-y-3">
          {items.map((f) => (
            <li key={f.q}>
              <p className="text-sm font-medium text-neutral-800">{f.q}</p>
              <p className="mt-0.5 text-sm text-neutral-600">{f.a}</p>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
