/**
 * migrate-tech-logos.js
 * Updates existing Technology documents: replaces logo identifier → CDN URL
 * Run: node scripts/migrate-tech-logos.js
 */
require('dotenv').config();
const mongoose   = require('mongoose');
const Technology = require('../src/models/Technology.model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/masterstack';

const LOGO_MAP = {
  angular:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/angularjs/angularjs-original.svg',
  react:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  vue:          'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vuejs/vuejs-original.svg',
  nextjs:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
  typescript:   'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  tailwind:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg',
  bootstrap:    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg',
  sass:         'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sass/sass-original.svg',
  nodejs:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
  python:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  php:          'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
  laravel:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-plain.svg',
  dotnet:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/dot-net/dot-net-original.svg',
  express:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg',
  nestjs:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nestjs/nestjs-plain.svg',
  django:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg',
  'react-native':'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  flutter:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg',
  swift:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/swift/swift-original.svg',
  kotlin:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg',
  mongodb:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
  postgresql:   'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
  mysql:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
  firebase:     'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg',
  aws:          'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg',
  azure:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg',
  git:          'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
  docker:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
  kubernetes:   'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg',
  github:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
  jenkins:      'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jenkins/jenkins-original.svg',
  nginx:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg',
  figma:        'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
  xd:           'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/xd/xd-plain.svg',
  sketch:       'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sketch/sketch-original.svg',
  photoshop:    'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-plain.svg',
  illustrator:  'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/illustrator/illustrator-plain.svg',
  framer:       'https://cdn.worldvectorlogo.com/logos/framer-motion.svg',
};

async function migrate() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const all = await Technology.find({}).lean();
  let updated = 0;
  let skipped = 0;

  for (const tech of all) {
    const url = LOGO_MAP[tech.logo];
    if (url) {
      await Technology.findByIdAndUpdate(tech._id, { logo: url });
      console.log(`🔄 ${tech.name?.en ?? tech._id}  →  ${url}`);
      updated++;
    } else {
      console.log(`⏭  ${tech.name?.en ?? tech._id}  (already a URL or unknown identifier)`);
      skipped++;
    }
  }

  console.log(`\n🎉 Done. Updated: ${updated} | Skipped: ${skipped}`);
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});