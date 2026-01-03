import { PrismaClient, ProjectRole, SocialMedia, PostType, PostStatus, PublicationStatus } from '../src/generated/prisma/client.js';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { config } from 'dotenv';
import path from 'path';
import { getDatabaseUrl } from '../src/config/database.config.js';

// Manual env loading
const nodeEnv = process.env.NODE_ENV || 'development';
config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
config();

// getDatabaseUrl() will throw if DATA_DIR is not set
const url = getDatabaseUrl();

const adapter = new PrismaBetterSqlite3({ url });

const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Starting comprehensive seeding...');

    // 1. CLEAR OLD DATA
    console.log('  Cleaning up old data...');
    await prisma.post.deleteMany({});
    await prisma.publication.deleteMany({});
    await prisma.channel.deleteMany({});
    await prisma.projectMember.deleteMany({});
    await prisma.project.deleteMany({});

    // 2. CREATE TEST USERS
    const devTelegramId = BigInt(process.env.TELEGRAM_ADMIN_ID || process.env.VITE_DEV_TELEGRAM_ID || '123456789');

    const users = [
        {
            id: '00000000-0000-0000-0000-000000000001',
            telegramId: devTelegramId,
            telegramUsername: 'dev_user',
            fullName: 'Разработчик (Dev)',
            isAdmin: true,
        },
        {
            id: '00000000-0000-0000-0000-000000000002',
            telegramId: 111111111n,
            telegramUsername: 'anna_editor',
            fullName: 'Анна Редактор',
            isAdmin: false,
        },
        {
            id: '00000000-0000-0000-0000-000000000003',
            telegramId: 987654321n,
            telegramUsername: 'viewer_user',
            fullName: 'Виктор Зритель',
            isAdmin: false,
        },
        {
            id: '00000000-0000-0000-0000-000000000004',
            telegramId: 222222222n,
            telegramUsername: 'alex_admin',
            fullName: 'Алексей Админ',
            isAdmin: true,
        },
    ];

    for (const u of users) {
        await prisma.user.upsert({
            where: { id: u.id },
            update: u,
            create: u,
        });
    }

    const devUser = users[0];
    const editorUser = users[1];
    const viewerUser = users[2];
    const adminUser = users[3];

    // 3. CREATE DIVERSE PROJECTS
    const projectData = [
        {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Технологии Будущего 🚀',
            description: 'Продвинутые туториалы по Node.js, Rust и AI агентам. Целевая аудитория: Профессиональные разработчики.',
            ownerId: devUser.id,
        },
        {
            id: '11111111-1111-1111-1111-111111111112',
            name: 'Хроники Путешествий 🌍',
            description: 'Фото-истории со всего мира. Советы по бюджетным поездкам и обзоры элитных курортов.',
            ownerId: devUser.id,
        },
        {
            id: '11111111-1111-1111-1111-111111111113',
            name: 'Финансы и Крипто 💰',
            description: 'Анализ рынка и инвестиционные стратегии. Не является финансовой рекомендацией.',
            ownerId: adminUser.id,
        },
        {
            id: '11111111-1111-1111-1111-111111111114',
            name: 'Здоровый Образ Жизни 🥗',
            description: null, // Test null description
            ownerId: devUser.id,
        }
    ];

    for (const p of projectData) {
        await prisma.project.upsert({
            where: { id: p.id },
            update: p,
            create: p,
        });
    }

    // 4. PROJECT MEMBERSHIPS
    const memberships = [
        { projectId: projectData[0].id, userId: devUser.id, role: ProjectRole.OWNER },
        { projectId: projectData[0].id, userId: editorUser.id, role: ProjectRole.EDITOR },
        { projectId: projectData[0].id, userId: viewerUser.id, role: ProjectRole.VIEWER },
        { projectId: projectData[1].id, userId: devUser.id, role: ProjectRole.OWNER },
        { projectId: projectData[2].id, userId: adminUser.id, role: ProjectRole.OWNER },
        { projectId: projectData[2].id, userId: devUser.id, role: ProjectRole.ADMIN },
        { projectId: projectData[3].id, userId: devUser.id, role: ProjectRole.OWNER },
    ];

    for (const m of memberships) {
        await prisma.projectMember.upsert({
            where: { projectId_userId: { projectId: m.projectId, userId: m.userId } },
            update: { role: m.role },
            create: m,
        });
    }

    // 5. CHANNELS
    const channelData = [
        { id: '22222222-2222-2222-2222-222222222221', projectId: projectData[0].id, socialMedia: SocialMedia.TELEGRAM, name: 'Основной Техно-канал', channelIdentifier: '@tech_main', language: 'ru-RU', isActive: true },
        { id: '22222222-2222-2222-2222-222222222222', projectId: projectData[0].id, socialMedia: SocialMedia.YOUTUBE, name: 'Техно-Туториалы YT', channelIdentifier: 'UC_TechTuts', language: 'en-US', isActive: true },
        { id: '22222222-2222-2222-2222-222222222223', projectId: projectData[1].id, socialMedia: SocialMedia.VK, name: 'Wanderlust VK', channelIdentifier: 'wander_vk_page', language: 'ru-RU', isActive: true },
        { id: '22222222-2222-2222-2222-222222222224', projectId: projectData[1].id, socialMedia: SocialMedia.TELEGRAM, name: 'Путешествия Ежедневно', channelIdentifier: '@travel_daily', language: 'ru-RU', isActive: true },
        { id: '22222222-2222-2222-2222-222222222225', projectId: projectData[2].id, socialMedia: SocialMedia.X, name: 'Финансовые Алертс', channelIdentifier: 'finance_guru', language: 'en-US', isActive: true },
        { id: '22222222-2222-2222-2222-222222222226', projectId: projectData[0].id, socialMedia: SocialMedia.TIKTOK, name: 'Tech Shorts', channelIdentifier: '@tech_shorts', language: 'en-US', isActive: true },
    ];

    for (const c of channelData) {
        await prisma.channel.upsert({
            where: { id: c.id },
            update: c,
            create: c,
        });
    }

    // 6. PUBLICATIONS (Master Content)
    const translationGroup1 = '55555555-5555-5555-5555-555555555551';

    const publications = [
        {
            id: '44444444-4444-4444-4444-444444444441',
            projectId: projectData[0].id,
            createdBy: devUser.id,
            title: 'Знакомство с Nuxt 4',
            description: 'Краткий обзор новых возможностей Nuxt 4 для разработчиков.',
            content: '<h1>Освоение Nuxt 4</h1><p>Nuxt 4 приносит удивительные новые функции для создания современных веб-приложений. Давайте изучим новую архитектуру приложений...</p>',
            authorComment: 'Это важный пост для нашего сообщества.',
            tags: 'nuxt,vue,frontend',
            status: PublicationStatus.PUBLISHED,
            postType: PostType.ARTICLE,
            postDate: new Date(2025, 0, 1),
            language: 'ru-RU',
            translationGroupId: translationGroup1,
        },
        {
            id: '44444444-4444-4444-4444-444444444445',
            projectId: projectData[0].id,
            createdBy: devUser.id,
            title: 'Introduction to Nuxt 4',
            content: '<h1>Mastering Nuxt 4</h1><p>Nuxt 4 brings amazing new features for building modern web applications. Let\'s explore the new app architecture...</p>',
            tags: 'nuxt,vue,frontend',
            status: PublicationStatus.PUBLISHED,
            postType: PostType.ARTICLE,
            language: 'en-US',
            translationGroupId: translationGroup1,
        },
        {
            id: '44444444-4444-4444-4444-444444444442',
            projectId: projectData[1].id,
            createdBy: devUser.id,
            title: 'Топ-5 скрытых жемчужин Киото',
            content: '<p>Киото — это больше, чем просто Кинкаку-дзи. Ознакомьтесь с этими 5 секретными местами, которые обычно пропускают туристы...</p>',
            tags: 'киото,япония,гид',
            status: PublicationStatus.PUBLISHED,
            postType: PostType.POST,
            language: 'ru-RU',
        },
        {
            id: '44444444-4444-4444-4444-444444444443',
            projectId: projectData[2].id,
            createdBy: adminUser.id,
            title: 'Прогноз цен на Биткоин 2025',
            content: '<p>Анализ исторических данных, чтобы понять, куда BTC может направиться в следующем году...</p>',
            tags: 'крипто,биткоин,финансы',
            status: PublicationStatus.SCHEDULED,
            postType: PostType.NEWS,
            language: 'ru-RU',
        },
        {
            id: '44444444-4444-4444-4444-444444444444',
            projectId: projectData[3].id,
            createdBy: devUser.id,
            title: 'Тест пустой публикации',
            content: '', // Test empty content
            status: PublicationStatus.DRAFT,
            postType: PostType.POST,
            language: 'ru-RU',
        },
        {
            id: '44444444-4444-4444-4444-444444444446',
            projectId: projectData[0].id,
            createdBy: devUser.id,
            title: 'Быстрый Привет!',
            content: 'Просто хотел поздороваться со всеми нашими подписчиками! Сегодня без больших постов.',
            status: PublicationStatus.PUBLISHED,
            postType: PostType.POST,
            language: 'ru-RU',
        }
    ];

    for (const pub of publications) {
        await prisma.publication.upsert({
            where: { id: pub.id },
            update: pub,
            create: pub,
        });
    }

    // 7. POSTS (Executions)
    const posts = [
        // Published posts
        {
            id: '33333333-3333-3333-3333-333333333331',
            publicationId: publications[0].id,
            channelId: channelData[0].id,
            socialMedia: 'TELEGRAM',
            tags: null, // Using publication tags
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
        {
            id: '33333333-3333-3333-3333-333333333337',
            publicationId: publications[1].id,
            channelId: channelData[1].id,
            socialMedia: 'YOUTUBE',
            tags: 'nuxt,vue,javascript', // Overriding publication tags for this channel
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(Date.now() - 3500000),
        },
        {
            id: '33333333-3333-3333-3333-333333333332',
            publicationId: publications[2].id,
            channelId: channelData[3].id,
            socialMedia: 'TELEGRAM',
            tags: null,
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(Date.now() - 7200000), // 2 hours ago
        },
        // Scheduled post
        {
            id: '33333333-3333-3333-3333-333333333333',
            publicationId: publications[3].id,
            channelId: channelData[4].id,
            socialMedia: 'X',
            tags: 'crypto,bitcoin,trading', // Overriding for X platform
            status: PostStatus.PENDING,
            scheduledAt: new Date(Date.now() + 86400000), // In 24 hours
        },
        // Failed post
        {
            id: '33333333-3333-3333-3333-333333333334',
            publicationId: publications[0].id,
            channelId: channelData[1].id,
            socialMedia: 'YOUTUBE',
            tags: null,
            status: PostStatus.FAILED,
        },
        // Post previously known as independent
        {
            id: '33333333-3333-3333-3333-333333333335',
            publicationId: publications[5].id,
            channelId: channelData[0].id,
            socialMedia: 'TELEGRAM',
            tags: null,
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(Date.now() - 1800000),
        },
        {
            id: '33333333-3333-3333-3333-333333333336',
            publicationId: publications[4].id,
            channelId: channelData[0].id,
            socialMedia: 'TELEGRAM',
            tags: null,
            status: PostStatus.PENDING,
        }
    ];

    for (const post of posts) {
        await prisma.post.upsert({
            where: { id: post.id },
            update: post,
            create: post,
        });
    }

    console.log('✅ Seeding complete! Database is now full-fledged.');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
