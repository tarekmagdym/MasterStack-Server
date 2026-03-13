/**
 * seed.tech.js
 * Run: node scripts/seed.tech.js
 */
require('dotenv').config();
const mongoose   = require('mongoose');
const Technology = require('../src/models/Technology.model');
const User       = require('../src/models/User.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/masterstack';

const CDN = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

const TECHNOLOGIES = [
  // FRONTEND
  { name: { en: 'Angular',       ar: 'أنجولار'        }, logo: `${CDN}/angularjs/angularjs-original.svg`,           category: 'frontend', proficiencyLevel: 'expert',       isPublished: true, order: 1 },
  { name: { en: 'React',         ar: 'رياكت'          }, logo: `${CDN}/react/react-original.svg`,                   category: 'frontend', proficiencyLevel: 'expert',       isPublished: true, order: 2 },
  { name: { en: 'Vue.js',        ar: 'فيو'            }, logo: `${CDN}/vuejs/vuejs-original.svg`,                   category: 'frontend', proficiencyLevel: 'advanced',     isPublished: true, order: 3 },
  { name: { en: 'Next.js',       ar: 'نكست'           }, logo: `${CDN}/nextjs/nextjs-original.svg`,                 category: 'frontend', proficiencyLevel: 'advanced',     isPublished: true, order: 4 },
  { name: { en: 'TypeScript',    ar: 'تايب سكريبت'    }, logo: `${CDN}/typescript/typescript-original.svg`,         category: 'frontend', proficiencyLevel: 'expert',       isPublished: true, order: 5 },
  { name: { en: 'Tailwind CSS',  ar: 'تيل ويند'       }, logo: `${CDN}/tailwindcss/tailwindcss-plain.svg`,          category: 'frontend', proficiencyLevel: 'expert',       isPublished: true, order: 6 },
  { name: { en: 'Bootstrap',     ar: 'بوتستراب'       }, logo: `${CDN}/bootstrap/bootstrap-original.svg`,           category: 'frontend', proficiencyLevel: 'expert',       isPublished: true, order: 7 },
  { name: { en: 'SASS',          ar: 'ساس'            }, logo: `${CDN}/sass/sass-original.svg`,                     category: 'frontend', proficiencyLevel: 'expert',       isPublished: true, order: 8 },
  // BACKEND
  { name: { en: 'Node.js',       ar: 'نود'            }, logo: `${CDN}/nodejs/nodejs-original.svg`,                 category: 'backend',  proficiencyLevel: 'expert',       isPublished: true, order: 1 },
  { name: { en: 'Python',        ar: 'بايثون'         }, logo: `${CDN}/python/python-original.svg`,                 category: 'backend',  proficiencyLevel: 'advanced',     isPublished: true, order: 2 },
  { name: { en: 'PHP',           ar: 'بي إتش بي'      }, logo: `${CDN}/php/php-original.svg`,                       category: 'backend',  proficiencyLevel: 'advanced',     isPublished: true, order: 3 },
  { name: { en: 'Laravel',       ar: 'لارافيل'        }, logo: `${CDN}/laravel/laravel-plain.svg`,                  category: 'backend',  proficiencyLevel: 'advanced',     isPublished: true, order: 4 },
  { name: { en: '.NET Core',     ar: 'دوت نت'         }, logo: `${CDN}/dot-net/dot-net-original.svg`,               category: 'backend',  proficiencyLevel: 'intermediate', isPublished: true, order: 5 },
  { name: { en: 'Express.js',    ar: 'إكسبريس'        }, logo: `${CDN}/express/express-original.svg`,               category: 'backend',  proficiencyLevel: 'expert',       isPublished: true, order: 6 },
  { name: { en: 'NestJS',        ar: 'نيست'           }, logo: `${CDN}/nestjs/nestjs-plain.svg`,                    category: 'backend',  proficiencyLevel: 'advanced',     isPublished: true, order: 7 },
  { name: { en: 'Django',        ar: 'دجانجو'         }, logo: `${CDN}/django/django-plain.svg`,                    category: 'backend',  proficiencyLevel: 'intermediate', isPublished: true, order: 8 },
  // MOBILE
  { name: { en: 'React Native',  ar: 'رياكت نيتيف'    }, logo: `${CDN}/react/react-original.svg`,                   category: 'mobile',   proficiencyLevel: 'advanced',     isPublished: true, order: 1 },
  { name: { en: 'Flutter',       ar: 'فلاتر'          }, logo: `${CDN}/flutter/flutter-original.svg`,               category: 'mobile',   proficiencyLevel: 'advanced',     isPublished: true, order: 2 },
  { name: { en: 'Swift',         ar: 'سويفت'          }, logo: `${CDN}/swift/swift-original.svg`,                   category: 'mobile',   proficiencyLevel: 'intermediate', isPublished: true, order: 3 },
  { name: { en: 'Kotlin',        ar: 'كوتلن'          }, logo: `${CDN}/kotlin/kotlin-original.svg`,                 category: 'mobile',   proficiencyLevel: 'intermediate', isPublished: true, order: 4 },
  // DATABASE / CLOUD
  { name: { en: 'MongoDB',           ar: 'مونجو'             }, logo: `${CDN}/mongodb/mongodb-original.svg`,                          category: 'database', proficiencyLevel: 'expert',       isPublished: true, order: 1 },
  { name: { en: 'PostgreSQL',        ar: 'بوستجر'            }, logo: `${CDN}/postgresql/postgresql-original.svg`,                    category: 'database', proficiencyLevel: 'advanced',     isPublished: true, order: 2 },
  { name: { en: 'MySQL',             ar: 'ماي إس كيو إل'     }, logo: `${CDN}/mysql/mysql-original.svg`,                              category: 'database', proficiencyLevel: 'advanced',     isPublished: true, order: 3 },
  { name: { en: 'Firebase',          ar: 'فاير بيس'          }, logo: `${CDN}/firebase/firebase-plain.svg`,                           category: 'database', proficiencyLevel: 'advanced',     isPublished: true, order: 4 },
  { name: { en: 'AWS',               ar: 'أمازون ويب سيرفيس' }, logo: `${CDN}/amazonwebservices/amazonwebservices-original.svg`,      category: 'database', proficiencyLevel: 'intermediate', isPublished: true, order: 5 },
  { name: { en: 'Microsoft Azure',   ar: 'مايكروسوفت أزور'   }, logo: `${CDN}/azure/azure-original.svg`,                              category: 'database', proficiencyLevel: 'intermediate', isPublished: true, order: 6 },
  // DEVOPS
  { name: { en: 'Git',            ar: 'جيت'           }, logo: `${CDN}/git/git-original.svg`,                       category: 'devops', proficiencyLevel: 'expert',       isPublished: true, order: 1 },
  { name: { en: 'Docker',         ar: 'دوكر'          }, logo: `${CDN}/docker/docker-original.svg`,                 category: 'devops', proficiencyLevel: 'advanced',     isPublished: true, order: 2 },
  { name: { en: 'Kubernetes',     ar: 'كوبرنيتيس'     }, logo: `${CDN}/kubernetes/kubernetes-plain.svg`,            category: 'devops', proficiencyLevel: 'intermediate', isPublished: true, order: 3 },
  { name: { en: 'GitHub Actions', ar: 'جيت هاب أكشنز' }, logo: `${CDN}/github/github-original.svg`,                 category: 'devops', proficiencyLevel: 'advanced',     isPublished: true, order: 4 },
  { name: { en: 'Jenkins',        ar: 'جينكينز'       }, logo: `${CDN}/jenkins/jenkins-original.svg`,               category: 'devops', proficiencyLevel: 'intermediate', isPublished: true, order: 5 },
  { name: { en: 'Nginx',          ar: 'إن جينكس'      }, logo: `${CDN}/nginx/nginx-original.svg`,                   category: 'devops', proficiencyLevel: 'advanced',     isPublished: true, order: 6 },
  // TOOLS (UI/UX)
  { name: { en: 'Figma',              ar: 'فيجما'        }, logo: `${CDN}/figma/figma-original.svg`,                 category: 'tools', proficiencyLevel: 'expert',       isPublished: true, order: 1 },
  { name: { en: 'Adobe XD',          ar: 'أدوبي إكس دي' }, logo: `${CDN}/xd/xd-plain.svg`,                          category: 'tools', proficiencyLevel: 'advanced',     isPublished: true, order: 2 },
  { name: { en: 'Sketch',            ar: 'سكيتش'         }, logo: `${CDN}/sketch/sketch-original.svg`,               category: 'tools', proficiencyLevel: 'intermediate', isPublished: true, order: 3 },
  { name: { en: 'Adobe Photoshop',   ar: 'فوتوشوب'       }, logo: `${CDN}/photoshop/photoshop-plain.svg`,            category: 'tools', proficiencyLevel: 'advanced',     isPublished: true, order: 4 },
  { name: { en: 'Adobe Illustrator', ar: 'إليستريتر'     }, logo: `${CDN}/illustrator/illustrator-plain.svg`,        category: 'tools', proficiencyLevel: 'advanced',     isPublished: true, order: 5 },
  { name: { en: 'Framer',            ar: 'فريمر'          }, logo: 'https://cdn.worldvectorlogo.com/logos/framer-motion.svg', category: 'tools', proficiencyLevel: 'intermediate', isPublished: true, order: 6 },
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

  for (const data of TECHNOLOGIES) {
    const exists = await Technology.findOne({ 'name.en': data.name.en });
    if (exists) {
      console.log(`⏭  Skipping "${data.name.en}" — already exists`);
      skipped++;
      continue;
    }
    await Technology.create({ ...data, createdBy: adminUser._id });
    console.log(`✅ Created: ${data.name.en} / ${data.name.ar}`);
    created++;
  }

  console.log(`\n🎉 Done. Created: ${created} | Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});