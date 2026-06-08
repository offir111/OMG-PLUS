import React, { useState, useRef, useEffect } from 'react';
import { useTypewriter } from '../../hooks/useTypewriter.js';

const BOOKS = [
  // תורה
  { he: 'בראשית', en: 'Genesis', section: 'תורה' },
  { he: 'שמות', en: 'Exodus', section: 'תורה' },
  { he: 'ויקרא', en: 'Leviticus', section: 'תורה' },
  { he: 'במדבר', en: 'Numbers', section: 'תורה' },
  { he: 'דברים', en: 'Deuteronomy', section: 'תורה' },
  // נביאים
  { he: 'יהושע', en: 'Joshua', section: 'נביאים' },
  { he: 'שופטים', en: 'Judges', section: 'נביאים' },
  { he: 'שמואל א', en: 'I Samuel', section: 'נביאים' },
  { he: 'שמואל ב', en: 'II Samuel', section: 'נביאים' },
  { he: 'מלכים א', en: 'I Kings', section: 'נביאים' },
  { he: 'מלכים ב', en: 'II Kings', section: 'נביאים' },
  { he: 'ישעיהו', en: 'Isaiah', section: 'נביאים' },
  { he: 'ירמיהו', en: 'Jeremiah', section: 'נביאים' },
  { he: 'יחזקאל', en: 'Ezekiel', section: 'נביאים' },
  { he: 'הושע', en: 'Hosea', section: 'נביאים' },
  { he: 'יואל', en: 'Joel', section: 'נביאים' },
  { he: 'עמוס', en: 'Amos', section: 'נביאים' },
  { he: 'עובדיה', en: 'Obadiah', section: 'נביאים' },
  { he: 'יונה', en: 'Jonah', section: 'נביאים' },
  { he: 'מיכה', en: 'Micah', section: 'נביאים' },
  { he: 'נחום', en: 'Nahum', section: 'נביאים' },
  { he: 'חבקוק', en: 'Habakkuk', section: 'נביאים' },
  { he: 'צפניה', en: 'Zephaniah', section: 'נביאים' },
  { he: 'חגי', en: 'Haggai', section: 'נביאים' },
  { he: 'זכריה', en: 'Zechariah', section: 'נביאים' },
  { he: 'מלאכי', en: 'Malachi', section: 'נביאים' },
  // כתובים
  { he: 'תהילים', en: 'Psalms', section: 'כתובים' },
  { he: 'משלי', en: 'Proverbs', section: 'כתובים' },
  { he: 'איוב', en: 'Job', section: 'כתובים' },
  { he: 'שיר השירים', en: 'Song of Songs', section: 'כתובים' },
  { he: 'רות', en: 'Ruth', section: 'כתובים' },
  { he: 'איכה', en: 'Lamentations', section: 'כתובים' },
  { he: 'קהלת', en: 'Ecclesiastes', section: 'כתובים' },
  { he: 'אסתר', en: 'Esther', section: 'כתובים' },
  { he: 'דניאל', en: 'Daniel', section: 'כתובים' },
  { he: 'עזרא', en: 'Ezra', section: 'כתובים' },
  { he: 'נחמיה', en: 'Nehemiah', section: 'כתובים' },
  { he: 'דברי הימים א', en: 'I Chronicles', section: 'כתובים' },
  { he: 'דברי הימים ב', en: 'II Chronicles', section: 'כתובים' },
];

// גמטריה → מספר
const HEB_NUMS = {
  'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9,'י':10,
  'יא':11,'יב':12,'יג':13,'יד':14,'טו':15,'טז':16,'יז':17,'יח':18,'יט':19,'כ':20,
  'כא':21,'כב':22,'כג':23,'כד':24,'כה':25,'כו':26,'כז':27,'כח':28,'כט':29,'ל':30,
  'לא':31,'לב':32,'לג':33,'לד':34,'לה':35,'לו':36,'לז':37,'לח':38,'לט':39,'מ':40,
  'מא':41,'מב':42,'מג':43,'מד':44,'מה':45,'מו':46,'מז':47,'מח':48,'מט':49,'נ':50,
  'נא':51,'נב':52,'ס':60,'ע':70,'פ':80,'צ':90,'ק':100,'קנ':150,
};

function hebOrArabicToNum(s) {
  if (!s) return null;
  const t = s.trim();
  if (/^\d+$/.test(t)) return parseInt(t, 10);
  return HEB_NUMS[t] ?? null;
}

const NUM_HEB = Object.fromEntries(Object.entries(HEB_NUMS).map(([k, v]) => [v, k]));
function numToHeb(n) { return NUM_HEB[n] ?? String(n); }

function parseVerseRef(q) {
  const qn = q.trim().replace(/[״"]/g, '');
  const sorted = [...BOOKS].sort((a, b) => b.he.length - a.he.length);
  for (const book of sorted) {
    if (!qn.startsWith(book.he)) continue;
    let rest = qn.slice(book.he.length).trim();
    rest = rest.replace(/^פרק\s*/, '');
    const parts = rest.split(/[\s:,]+/).filter(p => p && p !== 'פסוק' && p !== 'פרק');
    if (parts.length === 0) return null;
    const ch = hebOrArabicToNum(parts[0]);
    if (!ch) return null;
    const vs = parts.length >= 2 ? hebOrArabicToNum(parts[1]) : null;
    return { book, chapter: ch, verse: vs };
  }
  return null;
}

const SECTION_COLORS = {
  תורה: 'var(--believer)',
  נביאים: 'var(--accent)',
  כתובים: 'var(--atheist)',
};

const CHAPTER_COUNTS = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, 'I Samuel': 31, 'II Samuel': 24,
  'I Kings': 22, 'II Kings': 25, Isaiah: 66, Jeremiah: 52, Ezekiel: 48,
  Hosea: 14, Joel: 4, Amos: 9, Obadiah: 1, Jonah: 4, Micah: 7,
  Nahum: 3, Habakkuk: 3, Zephaniah: 3, Haggai: 2, Zechariah: 14, Malachi: 3,
  Psalms: 150, Proverbs: 31, Job: 42, 'Song of Songs': 8,
  Ruth: 4, Lamentations: 5, Ecclesiastes: 12, Esther: 10,
  Daniel: 12, Ezra: 10, Nehemiah: 13, 'I Chronicles': 29, 'II Chronicles': 36,
};

const QUICK_CHIPS = [
  'תהילים',
  'ברכות',
  'קידוש שבת',
  'קדיש',
  'עשרת הדיברות',
  'קריאת שמע',
  'עקדת יצחק',
  'קריעת ים סוף',
  'אשת לוט',
  'משה בתיבה',
  'דוד וגוליית',
  'יונה והדג',
  'גן עדן',
  'נח ומבול',
];

const BRACHOT_DATA = {
  summary: 'מאה ברכות בכל יום — תקנת דוד המלך',
  searchType: 'topic',
  explanation: 'על פי התלמוד (מנחות מג:), תיקן דוד המלך לברך מאה ברכות בכל יום, כנגד מגפה שפגעה בעם ישראל. הברכות מחולקות לסוגים: ברכות השחר, ברכות הנהנין על אוכל ושתייה, וברכות המצוות. כל ברכה פותחת ב"ברוך אתה ה׳ אלוהינו מלך העולם".',
  didYouKnow: 'מנהג מאה הברכות נועד להרבות בזכירת הבורא — כל ברכה היא מעשה חיבור בין האדם לאלוהיו.',
  relatedTopics: ['קידוש שבת', 'קדיש', 'תפילת שחרית'],
  results: [
    { ref: 'ברכות השחר', text: 'אֱלֹהַי, נְשָׁמָה שֶׁנָּתַתָּ בִּי טְהוֹרָה הִיא... / הַמַּעֲבִיר שֵׁנָה מֵעֵינַי... / עַל נְטִילַת יָדַיִם / בִּרְכּוֹת הַתּוֹרָה', context: 'ברכות הנאמרות בבוקר עם הקימה', relevanceScore: 5 },
    { ref: 'המוציא — על לחם', text: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, הַמּוֹצִיא לֶחֶם מִן הָאָרֶץ', context: 'ברכת הנהנין על לחם ופת — מחייבת נטילת ידיים לפניה', relevanceScore: 5 },
    { ref: 'בורא מיני מזונות', text: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא מִינֵי מְזוֹנוֹת', context: 'ברכת הנהנין על עוגות, בורקס, פסטה, אורז ומאפים', relevanceScore: 5 },
    { ref: 'בורא פרי הגפן — על יין', text: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן', context: 'ברכת הנהנין על יין וענבים — נאמרת גם בקידוש ובהבדלה', relevanceScore: 5 },
    { ref: 'בורא פרי העץ', text: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הָעֵץ', context: 'ברכת הנהנין על פירות האילן: תפוח, אגס, שקד, זית ועוד', relevanceScore: 4 },
    { ref: 'בורא פרי האדמה', text: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הָאֲדָמָה', context: 'ברכת הנהנין על ירקות ופירות הגדלים מהאדמה', relevanceScore: 4 },
    { ref: 'שהכל נהיה בדברו', text: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, שֶׁהַכֹּל נִהְיֶה בִּדְבָרוֹ', context: 'ברכת הנהנין על מים, בשר, ביצים, גבינה, מיץ ושאר מאכלים שאין להם ברכה ספציפית', relevanceScore: 4 },
    { ref: 'ברכת המזון', text: 'ארבע ברכות: הַזָּן אֶת הַכֹּל / עַל הָאָרֶץ וְעַל הַמָּזוֹן / בּוֹנֵה יְרוּשָׁלַיִם / הַטּוֹב וְהַמֵּטִיב', context: 'ברכה אחרונה מן התורה — נאמרת לאחר סעודת לחם', relevanceScore: 4 },
    { ref: 'בורא נפשות', text: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא נְפָשׁוֹת רַבּוֹת וְחֶסְרוֹנָן עַל כָּל מַה שֶׁבָּרָאתָ...', context: 'ברכה אחרונה על מים, מיץ, בשר, ביצים, ירקות ופירות (לא לחם ויין)', relevanceScore: 3 },
  ],
};

const BIBLE_HARDCODED = {
  'תהילים': {
    summary: '150 מזמורים — שיר ותפילה לדוד המלך',
    searchType: 'topic',
    explanation: 'ספר תהילים מכיל 150 מזמורים ונחשב לספר התפילה המרכזי ביהדות. רובם מיוחסים לדוד המלך, אם כי חלקם לאסף, בני קורח ועוד. הספר מכסה את כל קשת הרגשות האנושיים — שמחה, צער, חרדה, תודה ותהייה. הוא נקרא כחלק מתפילת שחרית, בלילות שבת, ובאזכרות.',
    didYouKnow: 'מנהג "אמירת תהילים" — קריאת הספר כולו בקהל — נפוץ בזמני צרה, מחלה ואבל, ומהווה מסורת חיה בכל קהילות ישראל.',
    relatedTopics: ['קדיש', 'קריאת שמע', 'ברכות'],
    results: [
      { ref: 'תהילים כ"ג — "ה׳ רועי"', text: 'ה׳ רֹעִי לֹא אֶחְסָר. בִּנְאוֹת דֶּשֶׁא יַרְבִּיצֵנִי, עַל מֵי מְנֻחוֹת יְנַהֲלֵנִי. נַפְשִׁי יְשׁוֹבֵב, יַנְחֵנִי בְמַעְגְּלֵי צֶדֶק לְמַעַן שְׁמוֹ.', context: 'המזמור הנקרא ביותר בתהילים — מזמור ביטחון ונחמה. נקרא בלוויות ובאזכרות.' },
      { ref: 'תהילים קמ"ה — "אשרי"', text: 'אֲשַׁלְּלָה שִׁמְךָ לְעוֹלָם וָעֶד. גָּדוֹל ה׳ וּמְהֻלָּל מְאֹד וְלִגְדֻלָּתוֹ אֵין חֵקֶר.', context: 'נאמר שלוש פעמים בכל יום בתפילת שחרית ומנחה — "אשרי יושבי ביתך".' },
      { ref: 'תהילים קכ"א — "שיר למעלות"', text: 'אֶשָּׂא עֵינַי אֶל הֶהָרִים מֵאַיִן יָבֹא עֶזְרִי. עֶזְרִי מֵעִם ה׳ עֹשֵׂה שָׁמַיִם וָאָרֶץ.', context: 'מזמור ביטחון — נקרא בנסיעות, בזמני סכנה ובסיום שבת.' },
      { ref: 'תהילים כ"ב — "אלי אלי למה עזבתני"', text: 'אֵלִי אֵלִי לָמָה עֲזַבְתָּנִי, רָחוֹק מִישׁוּעָתִי דִּבְרֵי שַׁאֲגָתִי.', context: 'מזמור שצוטט על ידי ישוע על הצלב (מתי כ"ז) — גם מרכזי בנצרות.' },
      { ref: 'תהילים קי"ח — "הודו לה׳"', text: 'זֶה הַיּוֹם עָשָׂה ה׳ נָגִילָה וְנִשְׂמְחָה בוֹ. אָנָּא ה׳ הוֹשִׁיעָה נָּא, אָנָּא ה׳ הַצְלִיחָה נָּא.', context: 'נאמר בהלל — בחגים, בראש חודש ובחנוכה. "אבן מאסו הבונים" — ציטוט ישוע בברית החדשה.' },
    ],
  },
  'קידוש שבת': {
    summary: 'טקס קדושת השבת על כוס יין',
    searchType: 'topic',
    explanation: 'הקידוש הוא טקס קדושת השבת הנאמר על כוס יין ביליל שבת ובשבת בבוקר לפני הסעודה. הוא מכיל פסוקים מבראשית המתארים את שביתת האל ביום השביעי, ברכת הגפן, וברכת קדושת השבת. מצות הקידוש היא מן התורה — "זכור את יום השבת לקדשו".',
    didYouKnow: 'ישנה מחלוקת: האם הקידוש מהתורה או מדרבנן. הרמב"ם פסק שהוא מהתורה — "זכור את יום השבת לקדשו" פירושו לזכרו בדיבור בכניסתו.',
    relatedTopics: ['ברכות', 'קדיש', 'עשרת הדיברות'],
    results: [
      { ref: 'פסוקי בראשית — יסוד הקידוש', text: 'וַיְכֻלּוּ הַשָּׁמַיִם וְהָאָרֶץ וְכָל צְבָאָם. וַיְכַל אֱלֹהִים בַּיּוֹם הַשְּׁבִיעִי מְלַאכְתּוֹ אֲשֶׁר עָשָׂה, וַיִּשְׁבֹּת בַּיּוֹם הַשְּׁבִיעִי.', context: 'בראשית ב:א-ג — הפסוקים הנאמרים בקידוש ליל שבת לפני ברכת הגפן.' },
      { ref: 'ברכת הגפן', text: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, בּוֹרֵא פְּרִי הַגָּפֶן.', context: 'ברכת היין — בסיס הקידוש. ניתן לקדש על חמר מדינה (מיץ ענבים) אם אין יין.' },
      { ref: 'ברכת קדושת השבת', text: 'בָּרוּךְ אַתָּה ה׳ אֱלֹהֵינוּ מֶלֶךְ הָעוֹלָם, אֲשֶׁר קִדְּשָׁנוּ בְּמִצְוֹתָיו וְרָצָה בָנוּ, וְשַׁבַּת קָדְשׁוֹ בְּאַהֲבָה וּבְרָצוֹן הִנְחִילָנוּ...', context: 'ברכת קדושת היום — לב הקידוש. מזכיר יציאת מצרים ובריאת העולם.' },
      { ref: 'קידושא רבא — שבת בבוקר', text: 'קידוש הבוקר קצר יותר: פסוק מ"שמור" (דברים ה), ברכת הגפן, ושתיית היין. נקרא "קידושא רבא" (קידוש גדול) בגלוי-עין — שם אירוני כי הוא הקצר.', context: 'נאמר לפני סעודת שחרית בשבת.' },
    ],
  },
  'קדיש': {
    summary: 'תפילת האבלים — שבח לאל בארמית',
    searchType: 'topic',
    explanation: 'הקדיש הוא תפילה ארמית עתיקה שמשמעותה "קדוש". תוכנה הוא שבח גדול לאל — ולא אזכור הנפטר כלל. נאמר על ידי אבלים לזכר הנפטר, אך גם כחלוקה בין חלקי התפילה ולאחר לימוד. קיים ב-5 סוגים שונים. הוא נאמר בציבור של מניין (10 גברים מבוגרים).',
    didYouKnow: 'מסורת "קדיש יתום" (אמירה ל-11 חודשים) נקשרת לסיפור בדבר בן שאמר קדיש לאביו הרשע וכך הקל את דינו בעולם הבא — מסופר על ידי הרב עקיבא.',
    relatedTopics: ['תהילים', 'ברכות', 'קריאת שמע'],
    results: [
      { ref: 'קדיש יתום — הנוסח', text: 'יִתְגַּדַּל וְיִתְקַדַּשׁ שְׁמֵהּ רַבָּא. בְּעָלְמָא דִּי בְרָא כִרְעוּתֵהּ, וְיַמְלִיךְ מַלְכוּתֵהּ... יְהֵא שְׁמֵהּ רַבָּא מְבָרַךְ לְעָלַם וּלְעָלְמֵי עָלְמַיָּא.', context: 'הנוסח העיקרי של הקדיש — בארמית, הנהוגה עם עברית בתפילה.' },
      { ref: '5 סוגי קדיש', text: '1) קדיש יתום — לאחר תפילה; 2) קדיש שלם — עם "תתקבל"; 3) חצי קדיש — חלוקה בתפילה; 4) קדיש דרבנן — לאחר לימוד; 5) קדיש לעילא — בחזרת הש"ץ ובימים נוראים.', context: 'כל סוג נאמר בהקשר שונה בתפילה.' },
      { ref: 'מתי נאמר קדיש יתום?', text: 'על פי המנהג המקובל: 11 חודשים לאחר פטירת ההורה (לא 12, כדי שלא להעיד שהנפטר היה רשע שדינו 12 חודש). גם ביום היארצייט (יום הפטירה) מדי שנה.', context: 'מנהג אמירת הקדיש לאבלים.' },
    ],
  },
  'עשרת הדיברות': {
    summary: 'עשרת הצוויות האלוהיות מהר סיני',
    searchType: 'topic',
    explanation: 'עשרת הדיברות הם עשרת הצוויות שנמסרו למשה בהר סיני (שמות כ׳, דברים ה׳). הם נחשבים לאבן הפינה של חוק המוסר היהודי, הנוצרי והמוסלמי. ישנה מחלוקת בין הדתות כיצד לחלקם ל-10 — יהודים, קתולים ופרוטסטנטים מונים אחרת.',
    didYouKnow: 'עשרת הדיברות לא נקראים בתפילה היומית — חכמים ביטלו את קריאתם כדי שלא יחשבו המינים שרק הם ניתנו בסיני ולא שאר התורה.',
    relatedTopics: ['קריאת שמע', 'קידוש שבת', 'עקדת יצחק'],
    results: [
      { ref: 'א–ב: אמונה ועבודה זרה', text: 'אָנֹכִי ה׳ אֱלֹהֶיךָ אֲשֶׁר הוֹצֵאתִיךָ מֵאֶרֶץ מִצְרַיִם. לֹא יִהְיֶה לְךָ אֱלֹהִים אֲחֵרִים עַל פָּנָי. לֹא תַעֲשֶׂה לְךָ פֶסֶל...', context: 'שמות כ:ב-ה — הדיברות הראשונות: קבלת עול מלכות שמים.' },
      { ref: 'ג–ד: שם ושבת', text: 'לֹא תִשָּׂא אֶת שֵׁם ה׳ אֱלֹהֶיךָ לַשָּׁוְא. זָכוֹר אֶת יוֹם הַשַּׁבָּת לְקַדְּשׁוֹ... כִּי שֵׁשֶׁת יָמִים עָשָׂה ה׳ אֶת הַשָּׁמַיִם וְאֶת הָאָרֶץ.', context: 'שמות כ:ז-יא — מצוות שבת מבוססת כאן על בריאה; בדברים — על יציאת מצרים.' },
      { ref: 'ה: כיבוד אב ואם', text: 'כַּבֵּד אֶת אָבִיךָ וְאֶת אִמֶּךָ לְמַעַן יַאֲרִכוּן יָמֶיךָ עַל הָאֲדָמָה אֲשֶׁר ה׳ אֱלֹהֶיךָ נֹתֵן לָךְ.', context: 'הדיבר היחיד עם הבטחת שכר — "למען יאריכון ימיך".' },
      { ref: 'ו–י: בין אדם לחברו', text: 'לֹא תִרְצָח. לֹא תִנְאָף. לֹא תִגְנֹב. לֹא תַעֲנֶה בְרֵעֲךָ עֵד שָׁקֶר. לֹא תַחְמֹד בֵּית רֵעֶךָ, לֹא תַחְמֹד אֵשֶׁת רֵעֶךָ...', context: 'חמשת הדיברות האחרונות — יסוד החברה המוסרית.' },
    ],
  },
  'קריאת שמע': {
    summary: 'הצהרת האמונה היהודית — פעמיים ביום',
    searchType: 'topic',
    explanation: 'קריאת שמע היא הצהרת האמונה היהודית הבסיסית, הנאמרת פעמיים ביום — בשחרית ובערבית. מורכבת משלושה קטעים מהתורה: "שמע" (דברים ו:ד-ט), "והיה אם שמוע" (דברים יא:יג-כא), "ויאמר" (במדבר טו:לז-מא). הפסוק הפותח הוא ביטוי המונותיאיזם הניצחי.',
    didYouKnow: 'על פי ההלכה, חייב לקרוא שמע "באזכרה" — בכוונה מיוחדת לפחות בפסוק הראשון. "ה׳ אחד" — יחיד בעולם, יחיד בכל המקומות, יחיד לעד.',
    relatedTopics: ['עשרת הדיברות', 'תפילת עמידה', 'מזוזה'],
    results: [
      { ref: 'פסוק ראשון — עיקר האמונה', text: 'שְׁמַע יִשְׂרָאֵל ה׳ אֱלֹהֵינוּ ה׳ אֶחָד.', context: 'דברים ו:ד — הפסוק נאמר בקול, בכוונה, ועוצמים את העיניים. אחריו בלחש: "ברוך שם כבוד מלכותו לעולם ועד".' },
      { ref: 'ואהבת — פרשה ראשונה', text: 'וְאָהַבְתָּ אֵת ה׳ אֱלֹהֶיךָ בְּכָל לְבָבְךָ וּבְכָל נַפְשְׁךָ וּבְכָל מְאֹדֶךָ. וְהָיוּ הַדְּבָרִים הָאֵלֶּה אֲשֶׁר אָנֹכִי מְצַוְּךָ הַיּוֹם עַל לְבָבֶךָ.', context: 'דברים ו:ה-ט — מצות אהבת ה׳, לימוד תורה, מזוזה ותפילין.' },
      { ref: 'מתי קוראים שמע?', text: 'שחרית — "משיכיר" (כשניתן להכיר חבר ממרחק 4 אמות) עד סוף שעה שלישית. ערבית — מצאת הכוכבים עד חצות (או עד עלות השחר בדיעבד).', context: 'זמני קריאת שמע — הלכה למעשה.' },
      { ref: 'שמע לפני פטירה', text: 'מסורת יהודית שהמוות האידיאלי הוא כאשר האדם נפטר בעוד מילת "אחד" על שפתיו — "מי שמת בה׳ — מת בה׳". רבים מהרוגי השואה נפטרו תוך אמירת שמע.', context: 'שמע כתפילת פטירה ומסירות נפש.' },
    ],
  },
  'עקדת יצחק': {
    summary: 'הניסיון הגדול ביותר של אברהם — בראשית כ"ב',
    searchType: 'event',
    explanation: 'עקדת יצחק (בראשית כ"ב) היא אחד הסיפורים הדרמטיים ביותר בתנ"ך ואחד הנושאים הנידונים ביותר בפילוסופיה דתית. אלוהים מצווה את אברהם להקריב את בנו יחידו יצחק — ואברהם נענה בציות מוחלט. ברגע האחרון מעצור המלאך את ידו.',
    didYouKnow: 'הר המוריה — מקום העקדה — מזוהה עם הר הבית בירושלים, עליו עמד בית המקדש ועומד כיום מסגד אל-אקצא וכיפת הסלע.',
    relatedTopics: ['נח ומבול', 'יציאת מצרים', 'גן עדן'],
    results: [
      { ref: 'בראשית כ"ב:א-ב — הציווי', text: 'וַיְהִי אַחַר הַדְּבָרִים הָאֵלֶּה וְהָאֱלֹהִים נִסָּה אֶת אַבְרָהָם... וַיֹּאמֶר קַח נָא אֶת בִּנְךָ אֶת יְחִידְךָ אֲשֶׁר אָהַבְתָּ אֶת יִצְחָק וְלֶךְ לְךָ אֶל אֶרֶץ הַמֹּרִיָּה.', context: 'הציווי האלוהי — הניסיון העשירי והגדול של אברהם.' },
      { ref: 'כ"ב:ז-ח — שיח האב והבן', text: 'וַיֹּאמֶר יִצְחָק אֶל אַבְרָהָם אָבִיו... הִנֵּה הָאֵשׁ וְהָעֵצִים וְאַיֵּה הַשֶּׂה לְעֹלָה? וַיֹּאמֶר אַבְרָהָם אֱלֹהִים יִרְאֶה לּוֹ הַשֶּׂה לְעֹלָה בְּנִי.', context: 'הרגע הנוגע ביותר — יצחק שואל, אברהם עונה באמונה.' },
      { ref: 'כ"ב:יב-יג — העצירה', text: 'וַיֹּאמֶר אַל תִּשְׁלַח יָדְךָ אֶל הַנַּעַר... כִּי עַתָּה יָדַעְתִּי כִּי יְרֵא אֱלֹהִים אַתָּה. וַיִּשָּׂא אַבְרָהָם אֶת עֵינָיו וַיַּרְא אַיִל.', context: 'המלאך עוצר, האיל נמצא בין הסבך — ונשחט במקום יצחק.' },
      { ref: 'עקדה בפילוסופיה', text: 'קירקגור ב"פחד ורעד" (1843) ניתח את העקדה כ"קפיצת האמונה" — האמונה מעבר לאתיקה האוניברסלית. אחרים (כגון קאנט) ראו בה דוגמה לסכנת עיוורון דתי.', context: 'העקדה כאבן בוחן פילוסופית.' },
    ],
  },
  'קריעת ים סוף': {
    summary: 'הנס הגדול של יציאת מצרים — שמות י"ד',
    searchType: 'event',
    explanation: 'קריעת ים סוף (שמות י"ד) היא שיא נס יציאת מצרים. בני ישראל לכודים בין צבא פרעה המתקרב לים. משה פורש את ידו — הים נבקע. ישראל עובר ביבשה, מצרים טובעים. שירת הים (שמות ט"ו) היא אחת הפואמות העתיקות ביותר בתנ"ך.',
    didYouKnow: 'קריעת ים סוף נזכרת בתפילה כל יום — "אמת ויציב" לפני תפילת שחרית. היא נחשבת לגדולה מכל עשר המכות.',
    relatedTopics: ['משה בתיבה', 'עשרת הדיברות', 'עקדת יצחק'],
    results: [
      { ref: 'שמות י"ד:כא — בקיעת הים', text: 'וַיֵּט מֹשֶׁה אֶת יָדוֹ עַל הַיָּם וַיּוֹלֶךְ ה׳ אֶת הַיָּם בְּרוּחַ קָדִים עַזָּה כָּל הַלַּיְלָה וַיָּשֶׂם אֶת הַיָּם לֶחָרָבָה וַיִּבָּקְעוּ הַמָּיִם.', context: 'שמות י"ד:כא — הנס הגדול.' },
      { ref: 'שמות ט"ו:א-ב — שירת הים', text: 'אָז יָשִׁיר מֹשֶׁה וּבְנֵי יִשְׂרָאֵל אֶת הַשִּׁירָה הַזֹּאת לַה׳ וַיֹּאמְרוּ לֵאמֹר — עָזִּי וְזִמְרָת יָהּ וַיְהִי לִי לִישׁוּעָה, זֶה אֵלִי וְאַנְוֵהוּ.', context: 'שירת הים — נאמרת בתפילת שחרית כל יום.' },
      { ref: 'מרים הנביאה — שירת הנשים', text: 'וַתִּקַּח מִרְיָם הַנְּבִיאָה אֲחוֹת אַהֲרֹן אֶת הַתֹּף בְּיָדָהּ וַתֵּצֶאןָ כָל הַנָּשִׁים אַחֲרֶיהָ בְּתֻפִּים וּבִמְחֹלֹת.', context: 'שמות ט"ו:כ — שירת הנשים בראשות מרים — חלק שלעתים נשכח.' },
    ],
  },
  'אשת לוט': {
    summary: 'הסתכלה אחורה — ונהפכה לנציב מלח',
    searchType: 'event',
    explanation: 'אשת לוט (בראשית י"ט) הפכה לנציב מלח כאשר הסתכלה לאחור על ערי סדום ועמורה הנהרסות, בניגוד לציווי המלאכים "אל תביטו אחריכם". הסיפור הפך לביטוי תרבותי עמוק לגעגוע למה שאסור, לבלתי-יכולת לעזוב את העבר.',
    didYouKnow: 'שמה של אשת לוט לא נזכר בתנ"ך. המדרש קורא לה "עידית" או "ירית". הר הסדום בנגב מכיל תצורות מלח בצורת עמוד — מסורת מקומית מזהה אחת מהן כ"אשת לוט".',
    relatedTopics: ['נח ומבול', 'עקדת יצחק', 'גן עדן'],
    results: [
      { ref: 'בראשית י"ט:כו', text: 'וַתַּבֵּט אִשְׁתּוֹ מֵאַחֲרָיו וַתְּהִי נְצִיב מֶלַח.', context: 'פסוק אחד — תיאור הקצר ביותר לגורל טרגי. ללא שם, ללא הסבר.' },
      { ref: 'מדוע הסתכלה — פרשנויות', text: '1) התמהמהה — חיכתה לבנותיה הנשואות שלא רצו לצאת. 2) פנתה לראות שכנים שמתים. 3) חמדה את הרכוש שהשאירה. 4) לא האמינה בעונש ובדקה.', context: 'פרשנויות חז"ל ופרשנים לסיבת הסתכלותה.' },
      { ref: 'ישוע על אשת לוט', text: '"זכרו את אשת לוט" (לוקס י"ז:לב) — ישוע מזכיר אותה כאזהרה לאלה שיסתכלו אחורה ביום הגאולה. גם בנצרות היא סמל לאי-עזיבת העבר.', context: 'הד לאשת לוט בברית החדשה.' },
    ],
  },
  'משה בתיבה': {
    summary: 'גואל ישראל גדל בארמון המלך — שמות ב׳',
    searchType: 'event',
    explanation: 'משה (שמות ב׳) נולד בעת גזרת פרעה להטיל כל בן זכר יילוד לנהר היאור. אמו יוכבד הציפה אותו בתיבת גומא מעוברה בזפת, בת פרעה מצאה אותו ואימצה אותו לבן. מרים אחותו הציעה מינקת — ויוכבד הניקה את בנה. כך גדל גואל ישראל בארמון פרעה.',
    didYouKnow: 'שם "משה" ניתן על ידי בת פרעה — "כי מן המים משיתיהו" (שמות ב:י). פרדוקסלי: שם עברי שמשמעותו "משוי מהמים" ניתן על ידי מצרית.',
    relatedTopics: ['קריעת ים סוף', 'עשרת הדיברות', 'עקדת יצחק'],
    results: [
      { ref: 'שמות ב:ב-ג — ההסתרה', text: 'וַתַּהַר הָאִשָּׁה וַתֵּלֶד בֵּן וַתֵּרֶא אֹתוֹ כִּי טוֹב הוּא וַתִּצְפְּנֵהוּ שְׁלֹשָׁה יְרָחִים. וְלֹא יָכְלָה עוֹד הַצְּפִינוֹ וַתִּקַּח לוֹ תֵּבַת גֹּמֶא.', context: 'שמות ב:ב-ג — ההחלטה הנואשת של האם.' },
      { ref: 'שמות ב:ה-ו — הגילוי', text: 'וַתֵּרֶד בַּת פַּרְעֹה לִרְחֹץ עַל הַיְאֹר... וַתִּרְאֶה אֶת הַתֵּבָה בְּתוֹךְ הַסּוּף וַתִּשְׁלַח אֶת אֲמָתָהּ וַתִּקָּחֶהָ. וַתִּפְתַּח וַתִּרְאֵהוּ אֶת הַיֶּלֶד.', context: 'בת פרעה מוצאת את משה ומחליטה לאמצו.' },
      { ref: 'מרים — האחות החכמה', text: 'מרים עמדה מרחוק וראתה. כאשר בת פרעה פתחה את התיבה, ניגשה מרים והציעה להביא מינקת עברייה — ובת פרעה הסכימה. כך חזר משה לידי אמו ממש.', context: 'שמות ב:ז-ט — חוכמת מרים.' },
    ],
  },
  'דוד וגוליית': {
    summary: 'רועה קטן מנצח ענק — שמואל א׳ י"ז',
    searchType: 'event',
    explanation: 'דוד וגוליית (שמואל א׳ י"ז) הוא אחד הסיפורים המפורסמים בכל הספרות העולמית. גוליית, לוחם פלשתי ענק (גבהו כ-2.9 מ׳), מאתגר כל ישראלי ל"מאבק יחידים". דוד, נער רועה, מגיע למחנה, מסרב לשריון שאול, ומפיל את הענק בקלע — כוח האמונה על הכוח הגופני.',
    didYouKnow: 'ניתוח רפואי מודרני (2013) הציע שגוליית סבל מאקרומגליה (הפרעת יותרת המוח) שגרמה לגדילתו — וגם לראייה כפולה, שהסבירה מדוע לא ראה את האבן הממהרת..',
    relatedTopics: ['שמואל', 'משה בתיבה', 'עקדת יצחק'],
    results: [
      { ref: 'שמואל א׳ י"ז:ד — גוליית', text: 'וַיֵּצֵא אִישׁ הַבֵּנַיִם מִמַּחֲנוֹת פְּלִשְׁתִּים גָּלְיָת שְׁמוֹ מִגַּת גָּבְהוֹ שֵׁשׁ אַמּוֹת וָזָרֶת.', context: 'שש אמות וזרת ≈ 2.85 מ׳. חרבו, שריונו וחניתו מתוארים בפירוט מרשים.' },
      { ref: 'י"ז:מה-מז — דוד עונה', text: 'וַיֹּאמֶר דָּוִד אֶל הַפְּלִשְׁתִּי אַתָּה בָּא אֵלַי בְּחֶרֶב וּבַחֲנִית וּבְכִידוֹן וְאָנֹכִי בָא אֵלֶיךָ בְּשֵׁם ה׳ צְבָאוֹת.', context: 'דוד מסרב לשריון שאול ובוטח באמונה בלבד.' },
      { ref: 'י"ז:מט-נ — ניפול הענק', text: 'וַיִּשְׁלַח דָּוִד אֶת יָדוֹ אֶל הַכֶּלִי וַיִּקַּח מִשָּׁם אֶבֶן וַיְקַלַּע וַיַּךְ אֶת הַפְּלִשְׁתִּי אֶל מִצְחוֹ... וַיִּפֹּל עַל פָּנָיו אָרְצָה.', context: 'אבן אחת — ענק אחד. המהלך שינה את ההיסטוריה.' },
    ],
  },
  'יונה והדג': {
    summary: 'הנביא שברח — ונבלע על ידי דג',
    searchType: 'event',
    explanation: 'יונה הנביא (ספר יונה) קיבל מאלוהים משימה לנבא לנינוה הרשעה. במקום לציית — עלה לאנייה שנסעה בכיוון ההפוך. סערה אדירה פגעה באנייה. יונה הסכים שיושלך לים — ודג גדול בלע אותו. שלושה ימים ושלושה לילות בבטן הדג, תפלל יונה, ואז הוקיא הדג אותו ליבשה.',
    didYouKnow: 'ספר יונה נקרא בשלמותו בתפילת מנחה של יום הכיפורים — כי עניינו תשובה וסליחה. נינוה שבה בתשובה ולא נענשה — המסר: גם הגויים יכולים לחזור בתשובה.',
    relatedTopics: ['נח ומבול', 'קריעת ים סוף', 'עשרת הדיברות'],
    results: [
      { ref: 'יונה א:א-ג — הבריחה', text: 'וַיְהִי דְבַר ה׳ אֶל יוֹנָה... קוּם לֵךְ אֶל נִינְוֵה... וַיָּקָם יוֹנָה לִבְרֹחַ תַּרְשִׁישָׁה מִלִּפְנֵי ה׳.', context: 'יונה א:א-ג — הנביא שברח מהאל.' },
      { ref: 'יונה ב:א-ב — תפילה מבטן הדג', text: 'וַיְמַן ה׳ דָּג גָּדוֹל לִבְלֹעַ אֶת יוֹנָה... וַיִּתְפַּלֵּל יוֹנָה אֶל ה׳ אֱלֹהָיו מִמְּעֵי הַדָּגָה.', context: 'יונה מתפלל מבטן הדג — אחת התפילות הדרמטיות בתנ"ך.' },
      { ref: 'יונה ג:י — נינוה נסלחת', text: 'וַיַּרְא הָאֱלֹהִים אֶת מַעֲשֵׂיהֶם כִּי שָׁבוּ מִדַּרְכָּם הָרָעָה וַיִּנָּחֶם הָאֱלֹהִים עַל הָרָעָה אֲשֶׁר דִּבֶּר לַעֲשׂוֹת לָהֶם וְלֹא עָשָׂה.', context: 'נינוה שבה בתשובה — ונסלחת. יונה, אגב, מאוכזב מכך.' },
    ],
  },
  'גן עדן': {
    summary: 'הגן הקדמוני — בראשית ב׳-ג׳',
    searchType: 'topic',
    explanation: 'גן עדן (בראשית ב׳-ג׳) הוא הגן שנטע אלוהים לאדם ולחוה — מקום של שלמות ואחדות עם הבורא. בו שני עצים מיוחדים: עץ החיים ועץ הדעת טוב ורע. חוה נפתית על ידי הנחש, אוכלת מעץ הדעת ומאכילה את אדם — ובעקבות כך גורשו שניהם מהגן.',
    didYouKnow: 'מיקום גן עדן: בראשית ב:יד מזכיר ארבע נהרות — פישון, גיחון, חידקל (חידקל = טיגריס) ופרת. מסורות שונות מציעות: מסופוטמיה, אתיופיה, ואפילו אפריקה הקדומה.',
    relatedTopics: ['נח ומבול', 'עקדת יצחק', 'אשת לוט'],
    results: [
      { ref: 'בראשית ב:ח-ט — הגן', text: 'וַיִּטַּע ה׳ אֱלֹהִים גַּן בְּעֵדֶן מִקֶּדֶם... וַיַּצְמַח ה׳ אֱלֹהִים מִן הָאֲדָמָה כָּל עֵץ נֶחְמָד לְמַרְאֶה וְטוֹב לְמַאֲכָל, וְעֵץ הַחַיִּים בְּתוֹךְ הַגָּן וְעֵץ הַדַּעַת טוֹב וָרָע.', context: 'שני העצים המרכזיים — עץ החיים ועץ הדעת.' },
      { ref: 'ג:ד-ה — פיתוי הנחש', text: 'וַיֹּאמֶר הַנָּחָשׁ אֶל הָאִשָּׁה לֹא מוֹת תְּמֻתוּן. כִּי יֹדֵעַ אֱלֹהִים כִּי בְּיוֹם אֲכָלְכֶם מִמֶּנּוּ וְנִפְקְחוּ עֵינֵיכֶם וִהְיִיתֶם כֵּאלֹהִים יֹדְעֵי טוֹב וָרָע.', context: 'הנחש מבטיח ידע — "והייתם כאלוהים".' },
      { ref: 'ג:כד — הגירוש', text: 'וַיְגָרֶשׁ אֶת הָאָדָם וַיַּשְׁכֵּן מִקֶּדֶם לְגַן עֵדֶן אֶת הַכְּרֻבִים וְאֵת לַהַט הַחֶרֶב הַמִּתְהַפֶּכֶת לִשְׁמֹר אֶת דֶּרֶךְ עֵץ הַחַיִּים.', context: 'הכרובים ולהט החרב שומרים על גן עדן לעד.' },
    ],
  },
  'נח ומבול': {
    summary: 'הצדיק היחידי — בראשית ו׳-ט׳',
    searchType: 'event',
    explanation: 'סיפור נח (בראשית ו׳-ט׳) מתאר כיצד אלוהים, מאוכזב מרשעות האנשים, מחליט למחוק את העולם במבול. נח — "איש צדיק תמים היה בדורותיו" — מצטווה לבנות תיבה ענקית ולהכניס אליה זוג מכל בעל חיים. אחרי 40 יום ולילה, המים יורדים, היונה מביאה ענף זית, וה׳ מבטיח לא להשמיד שוב.',
    didYouKnow: 'סיפורי מבול קיימים ב-200+ תרבויות ברחבי העולם — גלגמש (בבל), מנו (הינדו), דאוקליון (יוון). חוקרים נחלקים: האם ממקור משותף, השפעה תרבותית, או אסון גיאולוגי אמיתי (ים שחור, 7,600 לפנה"ס).',
    relatedTopics: ['גן עדן', 'עקדת יצחק', 'אשת לוט'],
    results: [
      { ref: 'בראשית ו:ח-ט — נח הצדיק', text: 'וְנֹחַ מָצָא חֵן בְּעֵינֵי ה׳. אֵלֶּה תּוֹלְדֹת נֹחַ, נֹחַ אִישׁ צַדִּיק תָּמִים הָיָה בְּדֹרֹתָיו אֶת הָאֱלֹהִים הִתְהַלֶּךְ נֹחַ.', context: 'ההגדרה של נח — "צדיק תמים בדורותיו" — שנויה במחלוקת: האם גדול אמיתי או רק ביחס לדורו?' },
      { ref: 'ז:יב — ארבעים יום', text: 'וַיְהִי הַגֶּשֶׁם עַל הָאָרֶץ אַרְבָּעִים יוֹם וְאַרְבָּעִים לָיְלָה.', context: '40 יום — מספר סמלי בתנ"ך: 40 שנה במדבר, 40 יום משה בהר.' },
      { ref: 'ח:יא — ענף הזית', text: 'וַתָּבֹא אֵלָיו הַיּוֹנָה לְעֵת עֶרֶב וְהִנֵּה עֲלֵה זַיִת טָרָף בְּפִיהָ... וַיֵּדַע נֹחַ כִּי קַלּוּ הַמַּיִם.', context: 'היונה עם ענף הזית — הסמל הגדול ביותר לשלום ותקווה בתרבות המערבית.' },
      { ref: 'ט:יג — קשת הברית', text: 'אֶת קַשְׁתִּי נָתַתִּי בֶּעָנָן וְהָיְתָה לְאוֹת בְּרִית בֵּינִי וּבֵין הָאָרֶץ.', context: 'קשת הקשת — ברית אלוהים עם נח ועם כל היצורים: לא יהיה עוד מבול.' },
    ],
  },
};

const SEARCH_TYPE_LABELS = {
  event: '📅 אירוע',
  character: '👤 דמות',
  topic: '💡 נושא',
  why: '❓ סיבה',
  verse: '📜 פסוק',
};

function SkeletonLoader() {
  return (
    <div className="bm-skeleton-wrap">
      <div className="bm-skeleton bm-skeleton-badge" />
      <div className="bm-skeleton bm-skeleton-line bm-skeleton-line--80" />
      <div className="bm-skeleton bm-skeleton-line bm-skeleton-line--100" />
      <div className="bm-skeleton bm-skeleton-line bm-skeleton-line--90" />
      <div className="bm-skeleton bm-skeleton-line bm-skeleton-line--70" />
      <div style={{ marginTop: 20 }}>
        {[1,2,3].map(i => (
          <div key={i} className="bm-skeleton-card">
            <div className="bm-skeleton bm-skeleton-line bm-skeleton-line--50" style={{ marginBottom: 10 }} />
            <div className="bm-skeleton bm-skeleton-line bm-skeleton-line--100" />
            <div className="bm-skeleton bm-skeleton-line bm-skeleton-line--80" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BiblePanel({ embedded = false, onClose }) {
  const [query, setQuery] = useState('');
  const [searchedQuery, setSearchedQuery] = useState('');
  const [groqData, setGroqData] = useState(null);
  const { displayed: typedExplanation, isDone: explanationDone } = useTypewriter(groqData?.explanation || '');
  const [refResult, setRefResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [verses, setVerses] = useState(null);
  const [versesLoading, setVersesLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedRef, setCopiedRef] = useState(null);
  const searchRef = useRef();
  const answerPanelRef = useRef();

  useEffect(() => { searchRef.current?.focus(); }, []);

  useEffect(() => {
    if ((groqData || refResult) && answerPanelRef.current) {
      answerPanelRef.current.scrollTop = 0;
    }
  }, [groqData, refResult]);

  const bookQueryMatch = query.trim()
    ? BOOKS.filter(b => b.he.includes(query) || b.en.toLowerCase().includes(query.toLowerCase()))
    : BOOKS;
  const filtered = bookQueryMatch.length > 0 ? bookQueryMatch : BOOKS;
  const sections = [...new Set(filtered.map(b => b.section))];

  function closeAnswerPanel() {
    setGroqData(null);
    setRefResult(null);
    setError('');
  }

  async function loadChapter(book, ch, highlightVerse = null) {
    setVersesLoading(true);
    setVerses(null);
    setChapter(ch);
    try {
      const ref = `${book.en}.${ch}`;
      const res = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?lang=he&commentary=0`);
      if (!res.ok) throw new Error('sefaria load failed');
      const data = await res.json();
      const heArr = Array.isArray(data.he) ? data.he : [];
      setVerses({ arr: heArr, highlight: highlightVerse });
    } catch {
      setVerses({ arr: [], highlight: null });
    }
    setVersesLoading(false);
  }

  async function fetchSingleVerse(book, ch, vs) {
    const ref = `${book.en}.${ch}.${vs}`;
    const res = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?lang=he&commentary=0`);
    if (!res.ok) throw new Error('sefaria verse failed');
    const data = await res.json();
    let text = '';
    if (typeof data.he === 'string') {
      text = data.he;
    } else if (Array.isArray(data.he)) {
      text = data.he[vs - 1] ?? data.he[0] ?? '';
    }
    return { text, url: `https://www.sefaria.org/${ref}` };
  }

  async function handleSearch(q = query) {
    const trimmed = (q || query).trim();
    if (!trimmed) return;
    closeAnswerPanel();
    setSelectedBook(null);
    setChapter(null);
    setVerses(null);
    setSearchedQuery(trimmed);

    const ref = parseVerseRef(trimmed);
    if (ref) {
      setLoading(true);
      try {
        if (ref.verse) {
          const { text } = await fetchSingleVerse(ref.book, ref.chapter, ref.verse);
          setRefResult({
            book: ref.book,
            chapter: ref.chapter,
            verse: ref.verse,
            text,
            label: `${ref.book.he} ${numToHeb(ref.chapter)}:${numToHeb(ref.verse)}`,
          });
        } else {
          setSelectedBook(ref.book);
          await loadChapter(ref.book, ref.chapter);
        }
      } catch {
        setError('לא ניתן לטעון את הפסוק מ-Sefaria');
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const BASE = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${BASE}/api/bible-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      if (!res.ok) throw new Error('bible search failed');
      const data = await res.json();
      const sortedResults = (data.results || []).slice().sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      setGroqData({
        summary: data.summary || '',
        searchType: data.searchType || 'topic',
        explanation: data.explanation || '',
        didYouKnow: data.didYouKnow || '',
        relatedTopics: data.relatedTopics || [],
        results: sortedResults,
      });
    } catch {
      setGroqData({ summary: '', searchType: '', explanation: '', didYouKnow: '', relatedTopics: [], results: [] });
    }
    setLoading(false);
  }

  function handleChipClick(chip) {
    setQuery(chip);
    const hardcoded = chip === 'ברכות' ? BRACHOT_DATA : BIBLE_HARDCODED[chip];
    if (hardcoded) {
      closeAnswerPanel();
      setSelectedBook(null);
      setChapter(null);
      setVerses(null);
      setSearchedQuery(chip);
      setGroqData(hardcoded);
      return;
    }
    handleSearch(chip);
  }

  function copyToClipboard(ref, text) {
    const toCopy = `${ref}\n${text}`;
    navigator.clipboard?.writeText(toCopy).then(() => {
      setCopiedRef(ref);
      setTimeout(() => setCopiedRef(null), 1800);
    });
  }

  const chapterCount = selectedBook ? (CHAPTER_COUNTS[selectedBook.en] ?? 30) : 0;
  const showAnswerPanel = (loading || groqData !== null || refResult !== null || error) && !selectedBook;
  const showBookList = !selectedBook;
  const showChapter = selectedBook && chapter;
  const showChapterPicker = selectedBook && !chapter;

  return (
    <div className={embedded ? 'bm-sheet bm-sheet-embedded' : 'bm-sheet'} role={embedded ? undefined : 'dialog'} aria-modal={embedded ? undefined : true} aria-labelledby="bible-modal-title">
      <style>{`
        /* ---- Answer panel overlay ---- */
        .bm-body { position: relative; }
        .bm-answer-panel {
          position: absolute;
          inset: 0;
          z-index: 10;
          background: var(--surface, #18181b);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 4px 32px rgba(0,0,0,0.45);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .bm-ap-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 11px 14px 10px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          flex-shrink: 0;
          direction: rtl;
          gap: 8px;
        }
        .bm-ap-title-wrap {
          flex: 1;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .bm-ap-title {
          font-size: 0.82rem;
          font-weight: 800;
          color: var(--gold, #fbbf24);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .bm-search-type-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 20px;
          background: rgba(251,191,36,0.15);
          color: var(--gold, #fbbf24);
          border: 1px solid rgba(251,191,36,0.3);
          white-space: nowrap;
          flex-shrink: 0;
        }
        .bm-ap-close {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: var(--text-secondary, #b4b4c0);
          font-size: 0.9rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          touch-action: manipulation;
          font-family: inherit;
          transition: background 0.12s;
        }
        .bm-ap-close:hover { background: rgba(255,255,255,0.12); }
        .bm-ap-body {
          flex: 1;
          overflow-y: auto;
          padding: 14px 14px 18px;
          direction: rtl;
        }
        /* ---- Summary badge ---- */
        .bm-summary-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 5px 12px;
          border-radius: 20px;
          background: linear-gradient(90deg, rgba(251,191,36,0.18) 0%, rgba(99,102,241,0.12) 100%);
          border: 1px solid rgba(251,191,36,0.35);
          color: var(--gold, #fbbf24);
          margin-bottom: 14px;
          direction: rtl;
        }
        /* ---- Explanation block ---- */
        .bm-explanation {
          font-size: 0.93rem;
          line-height: 1.85;
          color: var(--text, #f4f4f8);
          margin-bottom: 16px;
          padding: 13px 15px;
          background: rgba(251,191,36,0.07);
          border-radius: 10px;
          border-right: 3px solid var(--gold, #fbbf24);
        }
        /* ---- Did you know ---- */
        .bm-did-you-know {
          font-size: 0.82rem;
          line-height: 1.7;
          color: var(--text-secondary, #b4b4c0);
          padding: 10px 13px;
          background: rgba(99,102,241,0.07);
          border-radius: 9px;
          border-right: 3px solid rgba(99,102,241,0.5);
          margin-top: 16px;
          direction: rtl;
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .bm-did-you-know::before { content: "💡"; flex-shrink: 0; }
        /* ---- Related topics ---- */
        .bm-related-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 14px 0;
          direction: rtl;
        }
        .bm-related-chip {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.05);
          color: var(--text-secondary, #b4b4c0);
          cursor: pointer;
          touch-action: manipulation;
          font-family: inherit;
          transition: background 0.12s, border-color 0.12s, color 0.12s;
        }
        .bm-related-chip:hover {
          background: rgba(251,191,36,0.12);
          border-color: rgba(251,191,36,0.35);
          color: var(--gold, #fbbf24);
        }
        .bm-citations-label {
          font-size: 0.7rem;
          font-weight: 900;
          color: var(--muted, #8a8a9a);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        /* ---- Verse cards with relevance ---- */
        .bm-verse-card { position: relative; }
        .bm-relevance-dots {
          display: flex;
          gap: 3px;
          align-items: center;
        }
        .bm-relevance-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          transition: background 0.1s;
        }
        .bm-relevance-dot.active { background: var(--gold, #fbbf24); }
        .bm-copy-btn {
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.05);
          color: var(--muted, #8a8a9a);
          font-size: 0.68rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          touch-action: manipulation;
          transition: background 0.12s, color 0.12s;
        }
        .bm-copy-btn:hover { background: rgba(255,255,255,0.1); color: var(--text-secondary); }
        .bm-copy-btn.copied { color: #34d399; border-color: rgba(52,211,153,0.35); background: rgba(52,211,153,0.08); }
        /* ---- Direct verse card ---- */
        .bm-ref-card {
          background: linear-gradient(135deg, rgba(251,191,36,0.10) 0%, rgba(99,102,241,0.07) 100%);
          border: 1px solid rgba(251,191,36,0.35);
          border-radius: 14px;
          padding: 18px 16px 14px;
          direction: rtl;
          margin-bottom: 12px;
        }
        .bm-ref-label {
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--gold, #fbbf24);
          letter-spacing: 0.08em;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bm-ref-text {
          font-size: 1.12rem;
          line-height: 2;
          color: var(--text, #f4f4f8);
          margin-bottom: 14px;
        }
        .bm-ref-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .bm-ref-btn {
          padding: 8px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.07);
          color: var(--text-secondary, #b4b4c0);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          touch-action: manipulation;
          transition: background 0.12s, border-color 0.12s;
        }
        .bm-ref-btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); }
        .bm-ref-btn--gold {
          border-color: rgba(251,191,36,0.45);
          background: rgba(251,191,36,0.1);
          color: var(--gold, #fbbf24);
        }
        .bm-ref-btn--gold:hover { background: rgba(251,191,36,0.18); }
        /* ---- Quick chips ---- */
        .bm-chips-wrap {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 6px 0 2px;
          scrollbar-width: none;
          direction: rtl;
        }
        .bm-chips-wrap::-webkit-scrollbar { display: none; }
        .bm-chip {
          font-size: 0.74rem;
          font-weight: 700;
          padding: 5px 11px;
          border-radius: 20px;
          border: 1px solid rgba(251,191,36,0.28);
          background: rgba(251,191,36,0.07);
          color: var(--gold, #fbbf24);
          cursor: pointer;
          white-space: nowrap;
          touch-action: manipulation;
          font-family: inherit;
          transition: background 0.12s, border-color 0.12s;
          flex-shrink: 0;
        }
        .bm-chip:hover { background: rgba(251,191,36,0.16); border-color: rgba(251,191,36,0.5); }
        /* ---- Skeleton loading ---- */
        .bm-skeleton-wrap { padding: 4px 0; }
        .bm-skeleton {
          border-radius: 6px;
          background: linear-gradient(90deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%);
          background-size: 200% 100%;
          animation: bm-shimmer 1.4s infinite;
        }
        @keyframes bm-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bm-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .bm-skeleton-badge { height: 22px; width: 120px; border-radius: 20px; margin-bottom: 14px; }
        .bm-skeleton-line { height: 14px; margin-bottom: 8px; }
        .bm-skeleton-line--100 { width: 100%; }
        .bm-skeleton-line--90 { width: 90%; }
        .bm-skeleton-line--80 { width: 80%; }
        .bm-skeleton-line--70 { width: 70%; }
        .bm-skeleton-line--50 { width: 50%; }
        .bm-skeleton-card {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 10px;
        }
        /* ---- Misc ---- */
        .bm-search-hint {
          font-size: 0.72rem;
          color: var(--muted, #8a8a9a);
          text-align: center;
          padding: 6px 8px 2px;
          direction: rtl;
          line-height: 1.6;
        }
        .bm-search-hint strong { color: var(--text-secondary, #b4b4c0); }
        .bm-error { color: #f87171; font-size: 0.85rem; text-align: center; padding: 16px; }
        .bm-verse-highlight {
          background: rgba(251,191,36,0.15);
          border-right: 3px solid var(--gold, #fbbf24);
          padding-right: 8px;
          border-radius: 4px;
        }
        .bm-groq-tag {
          display: inline-block;
          font-size: 0.62rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(99,102,241,0.2);
          color: #a5b4fc;
          letter-spacing: 0.06em;
          vertical-align: middle;
          margin-right: 4px;
        }
      `}</style>

      <div className="bm-header">
        <span className="bm-title" id="bible-modal-title">ספר התנ״ך</span>
        {!embedded && onClose && <button type="button" className="bm-close" onClick={onClose} aria-label="סגור">✕</button>}
      </div>

      <div className="bm-search">
        <input
          ref={searchRef}
          placeholder="חפש פסוק, אירוע, נושא… (בראשית ג טו / אשת לוט)"
          value={query}
          onChange={e => { setQuery(e.target.value); closeAnswerPanel(); setSelectedBook(null); setChapter(null); setVerses(null); }}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button type="button" className="bm-search-btn" onClick={() => handleSearch()} aria-label="חיפוש">🔍</button>
        {query && (
          <button type="button" className="btn-clear-search" onClick={() => { setQuery(''); closeAnswerPanel(); setSelectedBook(null); setChapter(null); setVerses(null); searchRef.current?.focus(); }} aria-label="נקה חיפוש">נקה</button>
        )}
      </div>

      {!query.trim() && (
        <>
          <div className="bm-search-hint">
            <strong>פסוק ישיר:</strong> בראשית ג טו · תהילים כג א ·
            <strong> אירוע:</strong> אשת לוט · קריעת ים סוף · עקדת יצחק
          </div>
          <div className="bm-chips-wrap" style={{ padding: '4px 14px 6px' }}>
            {QUICK_CHIPS.map(chip => (
              <button key={chip} type="button" className="bm-chip" onClick={() => handleChipClick(chip)}>
                {chip}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="bm-body">

        {/* ---- לוח תשובות (overlay) ---- */}
        {showAnswerPanel && (
          <div className="bm-answer-panel">
            <div className="bm-ap-header">
              <div className="bm-ap-title-wrap">
                {groqData?.searchType && (
                  <span className="bm-search-type-badge">{SEARCH_TYPE_LABELS[groqData.searchType] || groqData.searchType}</span>
                )}
                <span className="bm-ap-title">📖 {searchedQuery}</span>
              </div>
              <button type="button" className="bm-ap-close" onClick={closeAnswerPanel} aria-label="סגור">✕</button>
            </div>

            <div className="bm-ap-body" ref={answerPanelRef}>
              {loading && <SkeletonLoader />}

              {error && !loading && <div className="bm-error">{error}</div>}

              {/* פסוק ישיר מ-Sefaria */}
              {refResult && !loading && (
                <div>
                  <div className="bm-ref-card">
                    <div className="bm-ref-label">
                      📖 {refResult.label}
                      <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '0.65rem' }}>· Sefaria</span>
                    </div>
                    <div className="bm-ref-text"
                      dangerouslySetInnerHTML={{ __html: refResult.text || '(טקסט לא זמין)' }}
                    />
                    <div className="bm-ref-actions">
                      <button
                        type="button"
                        className="bm-ref-btn bm-ref-btn--gold"
                        onClick={() => {
                          closeAnswerPanel();
                          setSelectedBook(refResult.book);
                          loadChapter(refResult.book, refResult.chapter, refResult.verse);
                        }}
                      >
                        פתח פרק {numToHeb(refResult.chapter)} ←
                      </button>
                      <button
                        type="button"
                        className="bm-ref-btn"
                        onClick={() => { closeAnswerPanel(); setQuery(''); }}
                      >
                        חיפוש חדש
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* תוצאות Groq — היררכיה מלאה */}
              {groqData && !loading && (
                <div>
                  {/* summary badge */}
                  {groqData.summary && (
                    <div className="bm-summary-badge">✨ {groqData.summary}</div>
                  )}

                  {/* explanation */}
                  {groqData.explanation ? (
                    <div className="bm-explanation">
                      {typedExplanation}
                      {!explanationDone && <span style={{ borderRight: '2px solid var(--gold,#fbbf24)', marginRight: 2, animation: 'bm-blink 0.7s step-end infinite' }}>&nbsp;</span>}
                    </div>
                  ) : null}

                  {/* citations */}
                  {groqData.results && groqData.results.length > 0 && (
                    <>
                      <div className="bm-citations-label">
                        <span className="bm-groq-tag">AI</span>
                        סימוכין מהתנ״ך · {groqData.results.length} פסוקים
                      </div>
                      {groqData.results.map((r, i) => (
                        <div key={i} className="bm-verse-card">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                              <div style={{ color: 'var(--gold)', fontSize: '0.82rem', fontWeight: 900, flexShrink: 0 }}>{r.ref}</div>
                              {r.relevanceScore > 0 && (
                                <div className="bm-relevance-dots">
                                  {[1,2,3,4,5].map(d => (
                                    <div key={d} className={`bm-relevance-dot${d <= r.relevanceScore ? ' active' : ''}`} />
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                              <button
                                type="button"
                                className={`bm-copy-btn${copiedRef === r.ref ? ' copied' : ''}`}
                                onClick={() => copyToClipboard(r.ref, r.text)}
                                title="העתק ציטוט"
                              >
                                {copiedRef === r.ref ? '✓ הועתק' : 'העתק'}
                              </button>
                              {r.ref && (() => {
                                const parsed = parseVerseRef(r.ref.replace(':', ' '));
                                if (!parsed) return null;
                                return (
                                  <button
                                    type="button"
                                    className="bm-ref-btn"
                                    style={{ fontSize: '0.7rem', padding: '4px 9px' }}
                                    onClick={() => {
                                      closeAnswerPanel();
                                      setSelectedBook(parsed.book);
                                      loadChapter(parsed.book, parsed.chapter, parsed.verse);
                                    }}
                                  >
                                    פתח פרק ←
                                  </button>
                                );
                              })()}
                            </div>
                          </div>
                          <div style={{ fontSize: '0.98rem', lineHeight: 1.9, direction: 'rtl', marginBottom: r.context ? 8 : 0 }}>
                            {r.text}
                          </div>
                          {r.context && (
                            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 8, direction: 'rtl' }}>
                              {r.context}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {/* related topics */}
                  {groqData.relatedTopics && groqData.relatedTopics.length > 0 && (
                    <>
                      <div className="bm-citations-label" style={{ marginTop: 18 }}>נושאים קשורים</div>
                      <div className="bm-related-wrap">
                        {groqData.relatedTopics.map((t, i) => (
                          <button
                            key={i}
                            type="button"
                            className="bm-related-chip"
                            onClick={() => { setQuery(t); handleSearch(t); }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* did you know */}
                  {groqData.didYouKnow && (
                    <div className="bm-did-you-know">{groqData.didYouKnow}</div>
                  )}

                  {groqData.results && groqData.results.length === 0 && !groqData.explanation && (
                    <p className="bm-muted">לא נמצאו תוצאות — נסה לנסח אחרת</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- תצוגת פרק ---- */}
        {showChapter && (
          <div>
            <button type="button" className="bm-back" onClick={() => { setChapter(null); setVerses(null); }}>
              ← {selectedBook.he}
            </button>
            <p className="bm-section-label" style={{ color: 'var(--text)' }}>{selectedBook.he} · פרק {numToHeb(chapter)}</p>
            {versesLoading && (
              <div className="bm-center"><div className="spinner" /></div>
            )}
            {verses && verses.arr.map((v, i) => {
              const vNum = i + 1;
              const isHL = verses.highlight === vNum;
              return (
                <div key={i} className={`bm-verse-card${isHL ? ' bm-verse-highlight' : ''}`} id={isHL ? 'bm-hl' : undefined}>
                  <span style={{ color: isHL ? 'var(--gold)' : 'var(--muted)', fontSize: '0.72rem', fontWeight: isHL ? 900 : 400, marginLeft: 8 }}>
                    {numToHeb(vNum)}
                  </span>
                  <span
                    style={{ fontSize: '0.95rem', lineHeight: 1.85, direction: 'rtl' }}
                    dangerouslySetInnerHTML={{ __html: typeof v === 'string' ? v : '' }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ---- בחירת פרק ---- */}
        {showChapterPicker && (
          <div>
            <button type="button" className="bm-back" onClick={() => setSelectedBook(null)}>← רשימת ספרים</button>
            <p className="bm-section-label" style={{ color: 'var(--text)' }}>{selectedBook.he} — בחר פרק</p>
            <div className="bm-chapter-grid">
              {Array.from({ length: chapterCount }, (_, i) => i + 1).map(ch => (
                <button type="button" key={ch} className="bm-chapter-btn" onClick={() => loadChapter(selectedBook, ch)}>{ch}</button>
              ))}
            </div>
          </div>
        )}

        {/* ---- רשימת ספרים (תמיד גלויה כשלא בתצוגת פרק) ---- */}
        {showBookList && sections.map(sec => (
          <div key={sec}>
            <p className="bm-section-label" style={{ color: SECTION_COLORS[sec] }}>{sec}</p>
            <div className="bm-book-grid">
              {filtered.filter(b => b.section === sec).map(b => (
                <button
                  type="button"
                  key={b.en}
                  className="bm-book-btn"
                  style={{ borderColor: SECTION_COLORS[b.section] }}
                  onClick={() => { setSelectedBook(b); setChapter(null); setVerses(null); }}
                >
                  {b.he}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BibleModal({ onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="bm-overlay" role="presentation">
      <BiblePanel onClose={onClose} />
    </div>
  );
}
