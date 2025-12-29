import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

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

    // 2. CREATE TEST BLOGS
    const techBlog = await prisma.blog.upsert({
        where: { id: '11111111-1111-1111-1111-111111111111' },
        update: {},
        create: {
            id: '11111111-1111-1111-1111-111111111111',
            name: 'Tech Blog',
            description: 'A blog about technology, programming, and software development',
            ownerId: devUser.id,
        },
    });

    const travelBlog = await prisma.blog.upsert({
        where: { id: '11111111-1111-1111-1111-111111111112' },
        update: {},
        create: {
            id: '11111111-1111-1111-1111-111111111112',
            name: 'Travel Adventures',
            description: 'Sharing travel experiences and tips',
            ownerId: devUser.id,
        },
    });

    // 3. CREATE BLOG MEMBERS
    await prisma.blogMember.upsert({
        where: { blogId_userId: { blogId: techBlog.id, userId: devUser.id } },
        update: { role: 'owner' },
        create: { blogId: techBlog.id, userId: devUser.id, role: 'owner' },
    });

    await prisma.blogMember.upsert({
        where: { blogId_userId: { blogId: techBlog.id, userId: editorUser.id } },
        update: { role: 'editor' },
        create: { blogId: techBlog.id, userId: editorUser.id, role: 'editor' },
    });

    await prisma.blogMember.upsert({
        where: { blogId_userId: { blogId: techBlog.id, userId: viewerUser.id } },
        update: { role: 'viewer' },
        create: { blogId: techBlog.id, userId: viewerUser.id, role: 'viewer' },
    });

    await prisma.blogMember.upsert({
        where: { blogId_userId: { blogId: travelBlog.id, userId: devUser.id } },
        update: { role: 'owner' },
        create: { blogId: travelBlog.id, userId: devUser.id, role: 'owner' },
    });

    // 4. CREATE CHANNELS
    const techChannel = await prisma.channel.upsert({
        where: { id: '22222222-2222-2222-2222-222222222221' },
        update: {},
        create: {
            id: '22222222-2222-2222-2222-222222222221',
            blogId: techBlog.id,
            socialMedia: 'telegram',
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
            blogId: techBlog.id,
            socialMedia: 'youtube',
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
            blogId: travelBlog.id,
            socialMedia: 'telegram',
            name: 'Travel Stories',
            channelIdentifier: '@travel_stories',
            isActive: true,
        },
    });

    // 5. CREATE POSTS
    await prisma.post.upsert({
        where: { id: '33333333-3333-3333-3333-333333333331' },
        update: {},
        create: {
            id: '33333333-3333-3333-3333-333333333331',
            channelId: techChannel.id,
            authorId: devUser.id,
            content: '<p>Welcome to our tech channel! 🚀</p><p>We will be sharing the latest news and tutorials about programming and technology.</p>',
            socialMedia: 'telegram',
            postType: 'post',
            title: 'Welcome Post',
            description: 'Introduction to our tech channel',
            tags: 'welcome,introduction,tech',
            status: 'published',
        },
    });

    await prisma.post.upsert({
        where: { id: '33333333-3333-3333-3333-333333333335' },
        update: {},
        create: {
            id: '33333333-3333-3333-3333-333333333335',
            channelId: travelChannel.id,
            authorId: devUser.id,
            content: '<p>Just arrived in Tokyo! 🗼 The city is amazing...</p>',
            socialMedia: 'telegram',
            postType: 'post',
            title: 'Tokyo Adventures',
            description: 'My first day in Tokyo',
            authorComment: 'Remember to add more photos before publishing',
            tags: 'tokyo,japan,travel,asia',
            status: 'draft',
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
