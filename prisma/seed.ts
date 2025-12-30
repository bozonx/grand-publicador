import { PrismaClient, ProjectRole, SocialMedia, PostType, PostStatus } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';
import { getDatabaseUrl } from '../src/config/database.config.js';

// Manual env loading
const nodeEnv = process.env.NODE_ENV || 'development';
config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
config();

// Set up DATABASE_URL if not already set
if (process.env.DATA_DIR && !process.env.DATABASE_URL) {
    process.env.DATABASE_URL = getDatabaseUrl();
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

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
        { id: '22222222-2222-2222-2222-222222222221', projectId: projectData[0].id, socialMedia: SocialMedia.TELEGRAM, name: 'Основной Техно-канал', channelIdentifier: '@tech_main', isActive: true },
        { id: '22222222-2222-2222-2222-222222222222', projectId: projectData[0].id, socialMedia: SocialMedia.YOUTUBE, name: 'Техно-Туториалы YT', channelIdentifier: 'UC_TechTuts', isActive: true },
        { id: '22222222-2222-2222-2222-222222222223', projectId: projectData[1].id, socialMedia: SocialMedia.VK, name: 'Wanderlust VK', channelIdentifier: 'wander_vk_page', isActive: true },
        { id: '22222222-2222-2222-2222-222222222224', projectId: projectData[1].id, socialMedia: SocialMedia.TELEGRAM, name: 'Путешествия Ежедневно', channelIdentifier: '@travel_daily', isActive: true },
        { id: '22222222-2222-2222-2222-222222222225', projectId: projectData[2].id, socialMedia: SocialMedia.X, name: 'Финансовые Алертс', channelIdentifier: 'finance_guru', isActive: true },
    ];

    for (const c of channelData) {
        await prisma.channel.upsert({
            where: { id: c.id },
            update: c,
            create: c,
        });
    }

    // 6. PUBLICATIONS (Master Content)
    const publications = [
        {
            id: '44444444-4444-4444-4444-444444444441',
            projectId: projectData[0].id,
            authorId: devUser.id,
            title: 'Знакомство с Nuxt 4',
            content: '<h1>Освоение Nuxt 4</h1><p>Nuxt 4 приносит удивительные новые функции для создания современных веб-приложений. Давайте изучим новую архитектуру приложений...</p>',
            tags: 'nuxt,vue,frontend',
            status: PostStatus.PUBLISHED,
        },
        {
            id: '44444444-4444-4444-4444-444444444442',
            projectId: projectData[1].id,
            authorId: devUser.id,
            title: 'Топ-5 скрытых жемчужин Киото',
            content: '<p>Киото — это больше, чем просто Кинкаку-дзи. Ознакомьтесь с этими 5 секретными местами, которые обычно пропускают туристы...</p>',
            tags: 'киото,япония,гид',
            status: PostStatus.PUBLISHED,
        },
        {
            id: '44444444-4444-4444-4444-444444444443',
            projectId: projectData[2].id,
            authorId: adminUser.id,
            title: 'Прогноз цен на Биткоин 2025',
            content: '<p>Анализ исторических данных, чтобы понять, куда BTC может направиться в следующем году...</p>',
            tags: 'крипто,биткоин,финансы',
            status: PostStatus.SCHEDULED,
        },
        {
            id: '44444444-4444-4444-4444-444444444444',
            projectId: projectData[3].id,
            authorId: devUser.id,
            title: 'Тест пустой публикации',
            content: '', // Test empty content
            status: PostStatus.DRAFT,
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
            authorId: devUser.id,
            socialMedia: 'TELEGRAM',
            postType: PostType.POST,
            title: publications[0].title,
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
        {
            id: '33333333-3333-3333-3333-333333333332',
            publicationId: publications[1].id,
            channelId: channelData[3].id,
            authorId: devUser.id,
            socialMedia: 'TELEGRAM',
            postType: PostType.POST,
            title: publications[1].title,
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(Date.now() - 7200000), // 2 hours ago
        },
        // Scheduled post
        {
            id: '33333333-3333-3333-3333-333333333333',
            publicationId: publications[2].id,
            channelId: channelData[4].id,
            authorId: adminUser.id,
            socialMedia: 'X',
            postType: PostType.NEWS,
            title: publications[2].title,
            status: PostStatus.SCHEDULED,
            scheduledAt: new Date(Date.now() + 86400000), // In 24 hours
        },
        // Failed post
        {
            id: '33333333-3333-3333-3333-333333333334',
            publicationId: publications[0].id,
            channelId: channelData[1].id,
            authorId: devUser.id,
            socialMedia: 'YOUTUBE',
            postType: PostType.VIDEO,
            title: `${publications[0].title} (Video Upgrade)`,
            status: PostStatus.FAILED,
            authorComment: 'Превышено время ожидания загрузки видео. Размер файла: 4ГБ.',
        },
        // Independent Post (no master publication)
        {
            id: '33333333-3333-3333-3333-333333333335',
            channelId: channelData[0].id,
            authorId: devUser.id,
            socialMedia: 'TELEGRAM',
            postType: PostType.POST,
            title: 'Быстрый Привет!',
            content: 'Просто хотел поздороваться со всеми нашими подписчиками! Сегодня без больших постов.',
            status: PostStatus.PUBLISHED,
            publishedAt: new Date(Date.now() - 1800000),
        },
        {
            id: '33333333-3333-3333-3333-333333333336',
            publicationId: publications[3].id,
            channelId: channelData[0].id,
            authorId: devUser.id,
            socialMedia: 'TELEGRAM',
            postType: PostType.POST,
            title: publications[3].title,
            status: PostStatus.DRAFT,
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
