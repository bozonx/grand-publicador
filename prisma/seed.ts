import { PrismaClient, ProjectRole, SocialMedia, PostType, PostStatus } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';

// Manual env loading for the script since we removed prisma.config.ts
const nodeEnv = process.env.NODE_ENV || 'development';
config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
config();

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});

async function main() {
    console.log('🌱 Starting seeding...');

    // 1. CREATE TEST USERS
    const devUser = await prisma.user.upsert({
        where: { telegramId: 123456789n },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            telegramId: 123456789n,
            username: 'dev_user',
            fullName: 'Dev User',
            isAdmin: true,
        },
    });

    const editorUser = await prisma.user.upsert({
        where: { id: '00000000-0000-0000-0000-000000000002' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000002',
            email: 'editor@example.com',
            fullName: 'Editor User',
            isAdmin: false,
        },
    });

    const viewerUser = await prisma.user.upsert({
        where: { telegramId: 987654321n },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000003',
            telegramId: 987654321n,
            username: 'viewer_user',
            fullName: 'Viewer User',
            isAdmin: false,
        },
    });

    // 2. CREATE PROJECTS (prev. BLOGS)
    const techProject = await prisma.project.upsert({
        where: { id: '11111111-1111-1111-1111-111111111111' },
        update: {},
        create: {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Tech Blog',
            description: 'A project about technology, programming, and software development',
            ownerId: devUser.id,
        },
    });

    const travelProject = await prisma.project.upsert({
        where: { id: '11111111-1111-1111-1111-111111111112' },
        update: {},
        create: {
            id: '11111111-1111-1111-1111-111111111112',
            name: 'Travel Adventures',
            description: 'Sharing travel experiences and tips',
            ownerId: devUser.id,
        },
    });

    // 3. CREATE PROJECT MEMBERS (prev. BLOG MEMBERS)
    await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: techProject.id, userId: devUser.id } },
        update: { role: ProjectRole.OWNER },
        create: { projectId: techProject.id, userId: devUser.id, role: ProjectRole.OWNER },
    });

    await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: techProject.id, userId: editorUser.id } },
        update: { role: ProjectRole.EDITOR },
        create: { projectId: techProject.id, userId: editorUser.id, role: ProjectRole.EDITOR },
    });

    await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: techProject.id, userId: viewerUser.id } },
        update: { role: ProjectRole.VIEWER },
        create: { projectId: techProject.id, userId: viewerUser.id, role: ProjectRole.VIEWER },
    });

    await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: travelProject.id, userId: devUser.id } },
        update: { role: ProjectRole.OWNER },
        create: { projectId: travelProject.id, userId: devUser.id, role: ProjectRole.OWNER },
    });

    // 4. CREATE CHANNELS
    const techChannel = await prisma.channel.upsert({
        where: { id: '22222222-2222-2222-2222-222222222221' },
        update: {},
        create: {
            id: '22222222-2222-2222-2222-222222222221',
            projectId: techProject.id,
            socialMedia: SocialMedia.TELEGRAM,
            name: 'Tech News TG',
            channelIdentifier: '@tech_news_channel',
            isActive: true,
        },
    });

    await prisma.channel.upsert({
        where: { id: '22222222-2222-2222-2222-222222222222' },
        update: {},
        create: {
            id: '22222222-2222-2222-2222-222222222222',
            projectId: techProject.id,
            socialMedia: SocialMedia.YOUTUBE,
            name: 'Tech Tutorials',
            channelIdentifier: 'UCxxxxxxxx',
            isActive: true,
        },
    });

    const travelChannel = await prisma.channel.upsert({
        where: { id: '22222222-2222-2222-2222-222222222224' },
        update: {},
        create: {
            id: '22222222-2222-2222-2222-222222222224',
            projectId: travelProject.id,
            socialMedia: SocialMedia.TELEGRAM,
            name: 'Travel Stories',
            channelIdentifier: '@travel_stories',
            isActive: true,
        },
    });

    // 5. CREATE PUBLICATIONS (Master Content)
    const welcomePub = await prisma.publication.upsert({
        where: { id: '44444444-4444-4444-4444-444444444441' },
        update: {},
        create: {
            id: '44444444-4444-4444-4444-444444444441',
            projectId: techProject.id,
            authorId: devUser.id,
            content: '<p>Welcome to our tech channel! 🚀</p><p>We will be sharing the latest news and tutorials about programming and technology.</p>',
            title: 'Welcome Post',
            tags: 'welcome,introduction,tech',
            status: PostStatus.PUBLISHED,
        }
    });

    const tokyoPub = await prisma.publication.upsert({
        where: { id: '44444444-4444-4444-4444-444444444442' },
        update: {},
        create: {
            id: '44444444-4444-4444-4444-444444444442',
            projectId: travelProject.id,
            authorId: devUser.id,
            content: '<p>Just arrived in Tokyo! 🗼 The city is amazing...</p>',
            title: 'Tokyo Adventures',
            tags: 'tokyo,japan,travel,asia',
            status: PostStatus.DRAFT,
        }
    });

    // 6. CREATE POSTS (Linked to Publication)
    await prisma.post.upsert({
        where: { id: '33333333-3333-3333-3333-333333333331' },
        update: {},
        create: {
            id: '33333333-3333-3333-3333-333333333331',
            publicationId: welcomePub.id,
            channelId: techChannel.id,
            authorId: devUser.id,
            // socialMedia is redundant if we look at channel, but schema keeps it.
            // Let's use the same as channel or specific.
            socialMedia: SocialMedia.TELEGRAM,
            postType: PostType.POST,
            status: PostStatus.PUBLISHED,
        },
    });

    await prisma.post.upsert({
        where: { id: '33333333-3333-3333-3333-333333333335' },
        update: {},
        create: {
            id: '33333333-3333-3333-3333-333333333335',
            publicationId: tokyoPub.id,
            channelId: travelChannel.id,
            authorId: devUser.id,
            content: null, // Inherit from Publication
            socialMedia: SocialMedia.TELEGRAM,
            postType: PostType.POST,
            authorComment: 'Remember to add more photos before publishing',
            status: PostStatus.DRAFT,
        },
    });

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
