/**
 * seed-services.js
 * Run: node seed-services.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Service  = require('../src/models/Service.model');
const User     = require('../src/models/User.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/masterstack';

const SERVICES = [
  {
    order: 1,
    icon: '📱',
    isFeatured: true,
    title: {
      en: 'Mobile App Development',
      ar: 'تطوير تطبيقات الجوال',
    },
    description: {
      en: 'We design and develop professional mobile apps that work seamlessly across all devices with outstanding user experience and performance. Whether you need a native iOS or Android app, or a cross-platform solution, we are here to bring your vision to life.',
      ar: 'نصمم ونطور تطبيقات جوال احترافية تعمل بسلاسة على جميع الأجهزة، مع تجربة مستخدم استثنائية وأداء عالٍ. سواء كنت تحتاج تطبيق iOS أو Android أصلي أو حل متعدد المنصات، نحن هنا لتحقيق رؤيتك.',
    },
    shortDescription: {
      en: 'Native & cross-platform mobile apps for iOS and Android.',
      ar: 'تطبيقات جوال أصلية ومتعددة المنصات لـ iOS وAndroid.',
    },
    features: [
      'iOS & Android native development',
      'Cross-platform solutions (React Native, Flutter)',
      'Modern & attractive user interface design',
      'Push notifications and live updates',
      'Payment gateway integration',
      'Advanced analytics & reporting',
    ],
    featuresAr: [
      'تطوير تطبيقات iOS وAndroid الأصلية',
      'حلول متعددة المنصات (React Native, Flutter)',
      'تصميم واجهة مستخدم عصرية وجذابة',
      'إشعارات فورية وتحديثات مباشرة',
      'تكامل مع بوابات الدفع الإلكتروني',
      'تحليلات وتقارير متقدمة',
    ],
    isPublished: true,
  },
  {
    order: 2,
    icon: '🖥️',
    isFeatured: true,
    title: {
      en: 'Website Development',
      ar: 'تطوير المواقع الإلكترونية',
    },
    description: {
      en: 'We build professional, fast, and responsive websites compatible with all devices. Optimised for search engines and designed to achieve your business goals — from landing pages to complex e-commerce platforms, we provide comprehensive web solutions.',
      ar: 'نبني مواقع إلكترونية احترافية سريعة ومتجاوبة مع جميع الأجهزة، محسنة لمحركات البحث، ومصممة لتحقيق أهدافك التجارية. من المواقع التعريفية إلى المتاجر الإلكترونية المعقدة، نوفر حلول ويب شاملة.',
    },
    shortDescription: {
      en: 'Fast, SEO-ready websites built for your business goals.',
      ar: 'مواقع سريعة ومحسّنة لمحركات البحث لتحقيق أهدافك التجارية.',
    },
    features: [
      'Responsive design for all devices',
      'Fully SEO optimised',
      'Easy-to-use content management system',
      'Outstanding speed and performance',
      'Advanced security and hack protection',
      'Integration with social and third-party tools',
    ],
    featuresAr: [
      'تصميم متجاوب مع جميع الأجهزة',
      'محسّن بالكامل لمحركات البحث SEO',
      'نظام إدارة محتوى سهل الاستخدام',
      'سرعة وأداء استثنائيان',
      'حماية أمنية متقدمة ضد الاختراق',
      'تكامل مع وسائل التواصل الاجتماعي وأدوات الطرف الثالث',
    ],
    isPublished: true,
  },
  {
    order: 3,
    icon: '🔄',
    isFeatured: true,
    title: {
      en: 'Subscription Systems',
      ar: 'أنظمة الاشتراكات',
    },
    description: {
      en: 'We build integrated subscription platforms that efficiently manage members and payments. The perfect solution for subscription-based services such as education platforms, paid courses, and exclusive content.',
      ar: 'نبني منصات اشتراكات متكاملة تدير الأعضاء والمدفوعات المتكررة والمحتوى الحصري بكفاءة عالية. حل مثالي للخدمات القائمة على الاشتراكات، الدورات التعليمية، والمحتوى المدفوع.',
    },
    shortDescription: {
      en: 'Full-featured subscription & membership management platforms.',
      ar: 'منصات إدارة اشتراكات وعضويات متكاملة.',
    },
    features: [
      'Flexible multi-tier subscription plans',
      'Recurring billing & secure payments',
      'Full subscriber management dashboard',
      'Detailed revenue and performance reports',
      'Automated email notifications',
      'Exclusive content & access level management',
    ],
    featuresAr: [
      'خطط اشتراك مرنة متعددة المستويات',
      'فوترة متكررة ومدفوعات آمنة',
      'لوحة تحكم شاملة لإدارة المشتركين',
      'تقارير مفصلة عن الإيرادات والأداء',
      'إشعارات بريد إلكتروني آلية',
      'إدارة المحتوى الحصري ومستويات الوصول',
    ],
    isPublished: true,
  },
  {
    order: 4,
    icon: '🤖',
    isFeatured: true,
    title: {
      en: 'AI & Machine Learning',
      ar: 'الذكاء الاصطناعي والتعلم الآلي',
    },
    description: {
      en: 'We integrate cutting-edge AI and machine learning solutions into your applications to automate workflows, predict outcomes, and deliver personalised user experiences. From chatbots to recommendation engines and computer vision, we bring the power of AI to your business.',
      ar: 'ندمج أحدث حلول الذكاء الاصطناعي والتعلم الآلي في تطبيقاتك لأتمتة سير العمل، والتنبؤ بالنتائج، وتقديم تجارب مستخدم مخصصة. من روبوتات المحادثة إلى محركات التوصية والرؤية الحاسوبية، نجلب قوة الذكاء الاصطناعي لعملك.',
    },
    shortDescription: {
      en: 'Smart AI & ML solutions integrated seamlessly into your products.',
      ar: 'حلول ذكاء اصطناعي وتعلم آلي مدمجة بسلاسة في منتجاتك.',
    },
    features: [
      'Custom AI model training & deployment',
      'Natural language processing (NLP) & chatbots',
      'Recommendation engines & personalisation',
      'Computer vision & image recognition',
      'Predictive analytics & data insights',
      'OpenAI / Gemini / Claude API integrations',
    ],
    featuresAr: [
      'تدريب ونشر نماذج ذكاء اصطناعي مخصصة',
      'معالجة اللغة الطبيعية وروبوتات المحادثة',
      'محركات التوصية والتخصيص',
      'الرؤية الحاسوبية والتعرف على الصور',
      'التحليلات التنبؤية واستخلاص رؤى البيانات',
      'تكامل مع OpenAI / Gemini / Claude API',
    ],
    isPublished: true,
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const adminUser = await User.findOne({ role: { $in: ['super_admin', 'admin'] } });
  if (!adminUser) {
    console.error('❌ No admin user found. Create one first.');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  let updated = 0;

  for (const data of SERVICES) {
    const exists = await Service.findOne({ 'title.en': data.title.en });
    if (exists) {
      // Update existing record to add featuresAr if missing
      if (!exists.featuresAr || exists.featuresAr.length === 0) {
        await Service.findByIdAndUpdate(exists._id, { featuresAr: data.featuresAr });
        console.log(`🔄 Updated featuresAr for: ${data.title.en}`);
        updated++;
      } else {
        console.log(`⏭  Skipping "${data.title.en}" — already exists`);
        skipped++;
      }
      continue;
    }
    await Service.create({ ...data, createdBy: adminUser._id });
    console.log(`✅ Created: ${data.title.en} / ${data.title.ar}`);
    created++;
  }

  console.log(`\n🎉 Done. Created: ${created} | Updated: ${updated} | Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});