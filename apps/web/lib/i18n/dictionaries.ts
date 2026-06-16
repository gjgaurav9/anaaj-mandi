/**
 * Translation dictionaries. Keys are dot-namespaced and shared across all
 * locales. English is the base/fallback — any key missing in hi/mr falls back
 * to en (see translate() in ./index).
 *
 * Languages: en (English), hi (Hindi), mr (Marathi).
 */

export const LOCALES = ['en', 'hi', 'mr'] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
};

export const DEFAULT_LOCALE: Locale = 'hi';

/** Cookie that persists the chosen locale across requests. */
export const LOCALE_COOKIE = 'am_lang';

/** Narrow an arbitrary string to a supported Locale, defaulting otherwise.
 *  Server-safe (no React) so Server Components can call it directly. */
export function asLocale(value: string | undefined | null): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}

type Dict = Record<string, string>;

const en: Dict = {
  // nav / header
  'nav.browse': 'Browse',
  'nav.dashboard': 'Dashboard',
  'nav.listings': 'My listings',
  'nav.inquiries': 'Inquiries',
  'nav.profile': 'Profile',
  'nav.home': 'Home',
  'nav.add': 'Add',
  'nav.admin': 'Admin',
  'nav.help': 'Help',
  'header.tagline': 'Grain marketplace · All India',
  'header.signIn': 'Sign in',

  // common
  'common.save': 'Save',
  'common.saving': 'Saving…',
  'common.saved': 'Saved',
  'common.cancel': 'Cancel',
  'common.submit': 'Submit',
  'common.edit': 'Edit',
  'common.verified': 'Verified',
  'common.unverified': 'Not verified',
  'common.optional': 'optional',
  'common.reviews': 'reviews',
  'common.years': 'yrs in business',
  'common.language': 'Language',

  // profile
  'profile.title': 'Profile',
  'profile.phone': 'Phone',
  'profile.whatsapp': 'WhatsApp number',
  'profile.whatsapp.help': 'Buyers connect here. Leave blank to use your phone number.',
  'profile.name': 'Name',
  'profile.role': 'Role',
  'profile.business': 'Business name',
  'profile.mandi': 'Mandi',
  'profile.years': 'Years in business',
  'profile.company': 'Company',
  'profile.kyc': 'Verification (KYC)',
  'profile.kyc.gst': 'GST number (GSTIN)',
  'profile.kyc.gstDoc': 'GST invoice / business proof',
  'profile.kyc.submit': 'Submit for verification',
  'profile.kyc.pending': 'Submitted — under review',
  'profile.kyc.verified': 'Your business is verified ✓',
  'profile.kyc.rejected': 'Verification was rejected',
  'profile.kyc.intro': 'Verified brokers earn buyer trust. Add your GST and a few details.',

  // reviews
  'reviews.title': 'Ratings & reviews',
  'reviews.rate': 'Rate this broker',
  'reviews.yourReview': 'Your review',
  'reviews.update': 'Update review',
  'reviews.submit': 'Submit rating',
  'reviews.comment': 'Comment (optional)',
  'reviews.none': 'No reviews yet.',
  'reviews.thanks': 'Thanks for your feedback!',
  'reviews.dim.payment_on_time': 'Payment on time',
  'reviews.dim.quality_match': 'Grain quality matched description',
  'reviews.dim.delivery': 'Delivery / pickup smooth',
  'reviews.dim.ease_of_deal': 'Ease of the deal',

  // help
  'help.title': 'Help & support',
  'help.intro': 'Something went wrong, or have a question? Tell us and our team will follow up.',
  'help.category': 'What is this about?',
  'help.message': 'Describe the problem',
  'help.submit': 'Submit report',
  'help.submitted': 'Report received. We will get back to you soon.',
  'help.whatsapp': 'Chat with us on WhatsApp',
  'help.myTickets': 'Your past reports',
  'help.noTickets': 'No reports yet.',
  'help.faq': 'Quick answers',
  'cat.payment': 'Payment issue',
  'cat.quality': 'Grain quality',
  'cat.delivery': 'Delivery problem',
  'cat.account': 'Account / login',
  'cat.other': 'Something else',

  // lot detail
  'lot.perQuintal': 'per quintal',
  'lot.available': 'available',
  'lot.quality': 'Quality',
  'lot.pickup': 'Pickup',
  'lot.listedBy': 'Listed by',
  'lot.connectWhatsApp': 'Connect on WhatsApp',
  'lot.signInToConnect': 'Sign in to connect on WhatsApp',
};

const hi: Dict = {
  'nav.browse': 'देखें',
  'nav.dashboard': 'डैशबोर्ड',
  'nav.listings': 'मेरी लिस्टिंग',
  'nav.inquiries': 'पूछताछ',
  'nav.profile': 'प्रोफ़ाइल',
  'nav.home': 'होम',
  'nav.add': 'जोड़ें',
  'nav.admin': 'एडमिन',
  'nav.help': 'मदद',
  'header.tagline': 'अनाज मंडी · पूरे भारत में',
  'header.signIn': 'साइन इन',

  'common.save': 'सेव करें',
  'common.saving': 'सेव हो रहा है…',
  'common.saved': 'सेव हो गया',
  'common.cancel': 'रद्द करें',
  'common.submit': 'जमा करें',
  'common.edit': 'बदलें',
  'common.verified': 'सत्यापित',
  'common.unverified': 'असत्यापित',
  'common.optional': 'वैकल्पिक',
  'common.reviews': 'समीक्षाएँ',
  'common.years': 'साल का अनुभव',
  'common.language': 'भाषा',

  'profile.title': 'प्रोफ़ाइल',
  'profile.phone': 'फ़ोन',
  'profile.whatsapp': 'व्हाट्सएप नंबर',
  'profile.whatsapp.help': 'खरीदार यहीं संपर्क करेंगे। खाली छोड़ें तो फ़ोन नंबर इस्तेमाल होगा।',
  'profile.name': 'नाम',
  'profile.role': 'भूमिका',
  'profile.business': 'व्यापार का नाम',
  'profile.mandi': 'मंडी',
  'profile.years': 'व्यापार के साल',
  'profile.company': 'कंपनी',
  'profile.kyc': 'सत्यापन (KYC)',
  'profile.kyc.gst': 'जीएसटी नंबर (GSTIN)',
  'profile.kyc.gstDoc': 'जीएसटी बिल / व्यापार प्रमाण',
  'profile.kyc.submit': 'सत्यापन के लिए भेजें',
  'profile.kyc.pending': 'जमा हो गया — समीक्षा जारी है',
  'profile.kyc.verified': 'आपका व्यापार सत्यापित है ✓',
  'profile.kyc.rejected': 'सत्यापन अस्वीकार हुआ',
  'profile.kyc.intro':
    'सत्यापित ब्रोकर पर खरीदार ज़्यादा भरोसा करते हैं। जीएसटी और कुछ जानकारी जोड़ें।',

  'reviews.title': 'रेटिंग और समीक्षाएँ',
  'reviews.rate': 'इस ब्रोकर को रेट करें',
  'reviews.yourReview': 'आपकी समीक्षा',
  'reviews.update': 'समीक्षा अपडेट करें',
  'reviews.submit': 'रेटिंग जमा करें',
  'reviews.comment': 'टिप्पणी (वैकल्पिक)',
  'reviews.none': 'अभी कोई समीक्षा नहीं।',
  'reviews.thanks': 'आपकी राय के लिए धन्यवाद!',
  'reviews.dim.payment_on_time': 'समय पर भुगतान',
  'reviews.dim.quality_match': 'अनाज की क्वालिटी विवरण से मेली',
  'reviews.dim.delivery': 'डिलीवरी / पिकअप आसान',
  'reviews.dim.ease_of_deal': 'सौदे में आसानी',

  'help.title': 'मदद और सहायता',
  'help.intro': 'कुछ गड़बड़ हुई या कोई सवाल है? हमें बताएं, हमारी टीम संपर्क करेगी।',
  'help.category': 'किस बारे में है?',
  'help.message': 'समस्या बताएं',
  'help.submit': 'रिपोर्ट भेजें',
  'help.submitted': 'रिपोर्ट मिल गई। हम जल्द संपर्क करेंगे।',
  'help.whatsapp': 'व्हाट्सएप पर बात करें',
  'help.myTickets': 'आपकी पिछली रिपोर्ट',
  'help.noTickets': 'अभी कोई रिपोर्ट नहीं।',
  'help.faq': 'झटपट जवाब',
  'cat.payment': 'भुगतान की समस्या',
  'cat.quality': 'अनाज की क्वालिटी',
  'cat.delivery': 'डिलीवरी की समस्या',
  'cat.account': 'अकाउंट / लॉगिन',
  'cat.other': 'कुछ और',

  'lot.perQuintal': 'प्रति क्विंटल',
  'lot.available': 'उपलब्ध',
  'lot.quality': 'क्वालिटी',
  'lot.pickup': 'पिकअप',
  'lot.listedBy': 'लिस्ट किया',
  'lot.connectWhatsApp': 'व्हाट्सएप पर जुड़ें',
  'lot.signInToConnect': 'व्हाट्सएप पर जुड़ने के लिए साइन इन करें',
};

const mr: Dict = {
  'nav.browse': 'पहा',
  'nav.dashboard': 'डॅशबोर्ड',
  'nav.listings': 'माझ्या याद्या',
  'nav.inquiries': 'चौकशी',
  'nav.profile': 'प्रोफाइल',
  'nav.home': 'होम',
  'nav.add': 'जोडा',
  'nav.admin': 'अ‍ॅडमिन',
  'nav.help': 'मदत',
  'header.tagline': 'धान्य बाजार · संपूर्ण भारत',
  'header.signIn': 'साइन इन',

  'common.save': 'सेव्ह करा',
  'common.saving': 'सेव्ह होत आहे…',
  'common.saved': 'सेव्ह झाले',
  'common.cancel': 'रद्द करा',
  'common.submit': 'सबमिट करा',
  'common.edit': 'बदला',
  'common.verified': 'पडताळणी झालेले',
  'common.unverified': 'पडताळणी नाही',
  'common.optional': 'ऐच्छिक',
  'common.reviews': 'पुनरावलोकने',
  'common.years': 'वर्षांचा अनुभव',
  'common.language': 'भाषा',

  'profile.title': 'प्रोफाइल',
  'profile.phone': 'फोन',
  'profile.whatsapp': 'व्हॉट्सअ‍ॅप नंबर',
  'profile.whatsapp.help': 'खरेदीदार इथेच संपर्क करतील. रिकामे ठेवल्यास फोन नंबर वापरला जाईल.',
  'profile.name': 'नाव',
  'profile.role': 'भूमिका',
  'profile.business': 'व्यवसायाचे नाव',
  'profile.mandi': 'मंडी',
  'profile.years': 'व्यवसायाची वर्षे',
  'profile.company': 'कंपनी',
  'profile.kyc': 'पडताळणी (KYC)',
  'profile.kyc.gst': 'जीएसटी क्रमांक (GSTIN)',
  'profile.kyc.gstDoc': 'जीएसटी बिल / व्यवसाय पुरावा',
  'profile.kyc.submit': 'पडताळणीसाठी पाठवा',
  'profile.kyc.pending': 'सबमिट केले — पुनरावलोकन सुरू आहे',
  'profile.kyc.verified': 'तुमचा व्यवसाय पडताळला आहे ✓',
  'profile.kyc.rejected': 'पडताळणी नाकारली',
  'profile.kyc.intro':
    'पडताळणी झालेल्या ब्रोकरवर खरेदीदार अधिक विश्वास ठेवतात. जीएसटी व माहिती जोडा.',

  'reviews.title': 'रेटिंग आणि पुनरावलोकने',
  'reviews.rate': 'या ब्रोकरला रेट करा',
  'reviews.yourReview': 'तुमचे पुनरावलोकन',
  'reviews.update': 'पुनरावलोकन अपडेट करा',
  'reviews.submit': 'रेटिंग सबमिट करा',
  'reviews.comment': 'टिप्पणी (ऐच्छिक)',
  'reviews.none': 'अजून पुनरावलोकन नाही.',
  'reviews.thanks': 'तुमच्या अभिप्रायाबद्दल धन्यवाद!',
  'reviews.dim.payment_on_time': 'वेळेवर पेमेंट',
  'reviews.dim.quality_match': 'धान्याची क्वालिटी वर्णनाशी जुळली',
  'reviews.dim.delivery': 'डिलिव्हरी / पिकअप सोपे',
  'reviews.dim.ease_of_deal': 'व्यवहाराची सुलभता',

  'help.title': 'मदत आणि सहाय्य',
  'help.intro': 'काही चूक झाली किंवा प्रश्न आहे? आम्हाला सांगा, आमची टीम संपर्क करेल.',
  'help.category': 'हे कशाबद्दल आहे?',
  'help.message': 'समस्या सांगा',
  'help.submit': 'अहवाल पाठवा',
  'help.submitted': 'अहवाल मिळाला. आम्ही लवकरच संपर्क करू.',
  'help.whatsapp': 'व्हॉट्सअ‍ॅपवर बोला',
  'help.myTickets': 'तुमचे मागील अहवाल',
  'help.noTickets': 'अजून अहवाल नाही.',
  'help.faq': 'झटपट उत्तरे',
  'cat.payment': 'पेमेंटची समस्या',
  'cat.quality': 'धान्याची क्वालिटी',
  'cat.delivery': 'डिलिव्हरीची समस्या',
  'cat.account': 'खाते / लॉगिन',
  'cat.other': 'इतर काही',

  'lot.perQuintal': 'प्रति क्विंटल',
  'lot.available': 'उपलब्ध',
  'lot.quality': 'क्वालिटी',
  'lot.pickup': 'पिकअप',
  'lot.listedBy': 'यांनी सूचीबद्ध केले',
  'lot.connectWhatsApp': 'व्हॉट्सअ‍ॅपवर संपर्क करा',
  'lot.signInToConnect': 'व्हॉट्सअ‍ॅपवर जोडण्यासाठी साइन इन करा',
};

export const DICTIONARIES: Record<Locale, Dict> = { en, hi, mr };

/** Translate `key` for `locale`, with `{var}` interpolation and en fallback.
 *  Pure / server-safe. */
export function translate(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const raw = DICTIONARIES[locale]?.[key] ?? DICTIONARIES.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
}
