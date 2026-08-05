import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const categories = [
  { name: 'Markets', slug: 'markets' },
  { name: 'Disasters', slug: 'disasters' },
  { name: 'Breaking News', slug: 'breaking-news' },
];

const sources = [
  {
    name: 'MarketWatch Top Stories',
    url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories',
    categorySlug: 'markets',
  },
  {
    name: 'NYT — FEMA',
    url: 'https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/topic/organization/federal-emergency-management-agency/rss.xml',
    categorySlug: 'disasters',
  },
  {
    name: 'NYT World',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    categorySlug: 'breaking-news',
  },
];

async function main() {
  const categoryIdBySlug: Record<string, string> = {};

  for (const category of categories) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    categoryIdBySlug[category.slug] = row.id;
  }

  for (const source of sources) {
    const existing = await prisma.source.findFirst({ where: { url: source.url } });
    if (existing) continue;

    await prisma.source.create({
      data: {
        name: source.name,
        url: source.url,
        type: 'RSS',
        categoryId: categoryIdBySlug[source.categorySlug],
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
