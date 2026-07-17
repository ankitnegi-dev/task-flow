/**
 * prisma/seed.js
 *
 * Seed script for TaskFlow database.
 * Run with: node prisma/seed.js
 *
 * Creates:
 *  - 2 demo users
 *  - 4 tags (Bug, Feature, Documentation, Urgent)
 *  - 15 sample tasks distributed across users with varied priorities,
 *    statuses, due dates (some past due), and tags
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns a Date object offset by `days` from today.
 * Negative values produce past dates (useful for overdue tasks).
 */
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding database...');

  // ── 1. Wipe existing data (order matters due to FK constraints) ────────────
  await prisma.taskTag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
  console.log('Cleared existing data.');

  // ── 2. Create users ────────────────────────────────────────────────────────
  const SALT_ROUNDS = 10;

  const [user1, user2] = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Demo User',
        email: 'demo@taskflow.com',
        password: await bcrypt.hash('demo123', SALT_ROUNDS),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Jane Smith',
        email: 'user2@taskflow.com',
        password: await bcrypt.hash('user123', SALT_ROUNDS),
      },
    }),
  ]);

  console.log(`Created users: ${user1.email}, ${user2.email}`);

  // ── 3. Create tags ─────────────────────────────────────────────────────────
  const [tagBug, tagFeature, tagDocs, tagUrgent] = await Promise.all([
    prisma.tag.create({ data: { name: 'Bug', color: '#ef4444' } }),         // red
    prisma.tag.create({ data: { name: 'Feature', color: '#3b82f6' } }),      // blue
    prisma.tag.create({ data: { name: 'Documentation', color: '#22c55e' } }), // green
    prisma.tag.create({ data: { name: 'Urgent', color: '#f97316' } }),        // orange
  ]);

  console.log('Created tags: Bug, Feature, Documentation, Urgent');

  // ── 4. Helper to create a task with optional tags ──────────────────────────
  async function createTask(data, tagIds = []) {
    const task = await prisma.task.create({ data });

    if (tagIds.length > 0) {
      await prisma.taskTag.createMany({
        data: tagIds.map((tagId) => ({ taskId: task.id, tagId })),
      });
    }

    return task;
  }

  // ── 5. Create tasks for user1 (demo@taskflow.com) ──────────────────────────
  const u1Tasks = await Promise.all([
    createTask(
      {
        userId: user1.id,
        title: 'Fix login page crash on Safari',
        description:
          'Users on Safari 16 report the app crashes when submitting the login form. Reproduce and patch.',
        priority: 'High',
        status: 'Pending',
        dueDate: daysFromNow(-3), // overdue
      },
      [tagBug.id, tagUrgent.id]
    ),

    createTask(
      {
        userId: user1.id,
        title: 'Implement dark mode toggle',
        description:
          'Add a theme switcher to the top navigation bar. Persist the user preference in localStorage.',
        priority: 'Medium',
        status: 'Pending',
        dueDate: daysFromNow(7),
      },
      [tagFeature.id]
    ),

    createTask(
      {
        userId: user1.id,
        title: 'Write API documentation',
        description:
          'Document all REST endpoints using OpenAPI 3.0 spec. Include request/response examples.',
        priority: 'Medium',
        status: 'Completed',
        dueDate: daysFromNow(-10), // past, but completed
      },
      [tagDocs.id]
    ),

    createTask(
      {
        userId: user1.id,
        title: 'Resolve memory leak in WebSocket handler',
        description:
          'Profiling shows heap usage grows unbounded during long-lived WebSocket sessions.',
        priority: 'High',
        status: 'Pending',
        dueDate: daysFromNow(-1), // overdue
      },
      [tagBug.id, tagUrgent.id]
    ),

    createTask(
      {
        userId: user1.id,
        title: 'Add CSV export for task list',
        description:
          'Allow users to export their task list as a CSV file from the dashboard.',
        priority: 'Low',
        status: 'Pending',
        dueDate: daysFromNow(14),
      },
      [tagFeature.id]
    ),

    createTask(
      {
        userId: user1.id,
        title: 'Update README with deployment instructions',
        description:
          'Include Docker Compose setup, environment variable descriptions, and production deployment steps.',
        priority: 'Low',
        status: 'Completed',
        dueDate: daysFromNow(-5),
      },
      [tagDocs.id]
    ),

    createTask(
      {
        userId: user1.id,
        title: 'Set up CI/CD pipeline',
        description:
          'Configure GitHub Actions to run tests and deploy to staging on every push to main.',
        priority: 'High',
        status: 'Pending',
        dueDate: daysFromNow(3),
      },
      [tagFeature.id, tagUrgent.id]
    ),

    createTask(
      {
        userId: user1.id,
        title: 'Fix incorrect task count in sidebar',
        description:
          'The pending task count in the sidebar does not update after marking a task as complete.',
        priority: 'Medium',
        status: 'Completed',
        dueDate: daysFromNow(-2),
      },
      [tagBug.id]
    ),

    createTask(
      {
        userId: user1.id,
        title: 'Design onboarding flow',
        description:
          'Create a step-by-step onboarding wizard for new users. Wireframes are in Figma.',
        priority: 'Medium',
        status: 'Pending',
        dueDate: daysFromNow(21),
      },
      [tagFeature.id]
    ),
  ]);

  console.log(`Created ${u1Tasks.length} tasks for ${user1.email}`);

  // ── 6. Create tasks for user2 (user2@taskflow.com) ─────────────────────────
  const u2Tasks = await Promise.all([
    createTask(
      {
        userId: user2.id,
        title: 'Audit dependencies for security vulnerabilities',
        description:
          'Run `npm audit` and resolve all high/critical findings before next release.',
        priority: 'High',
        status: 'Pending',
        dueDate: daysFromNow(-4), // overdue
      },
      [tagUrgent.id, tagBug.id]
    ),

    createTask(
      {
        userId: user2.id,
        title: 'Add two-factor authentication',
        description:
          'Implement TOTP-based 2FA using the speakeasy library. QR code enrollment via /settings.',
        priority: 'High',
        status: 'Pending',
        dueDate: daysFromNow(10),
      },
      [tagFeature.id, tagUrgent.id]
    ),

    createTask(
      {
        userId: user2.id,
        title: 'Write unit tests for task controller',
        description:
          'Achieve at least 80% code coverage for src/controllers/taskController.js using Jest.',
        priority: 'Medium',
        status: 'Pending',
        dueDate: daysFromNow(5),
      },
      [tagDocs.id]
    ),

    createTask(
      {
        userId: user2.id,
        title: 'Migrate database to managed PostgreSQL',
        description:
          'Move from self-hosted Postgres to AWS RDS. Update DATABASE_URL and test connectivity.',
        priority: 'High',
        status: 'Completed',
        dueDate: daysFromNow(-7),
      },
      [tagFeature.id]
    ),

    createTask(
      {
        userId: user2.id,
        title: 'Optimise slow task list query',
        description:
          'The GET /api/tasks endpoint takes >2s for users with >500 tasks. Add indexes and review the Prisma query.',
        priority: 'Medium',
        status: 'Pending',
        dueDate: daysFromNow(-1), // overdue
      },
      [tagBug.id, tagUrgent.id]
    ),

    createTask(
      {
        userId: user2.id,
        title: 'Create user profile page',
        description:
          'Allow users to update their name, email, and avatar from /profile.',
        priority: 'Low',
        status: 'Pending',
        dueDate: daysFromNow(30),
      },
      [tagFeature.id]
    ),
  ]);

  console.log(`Created ${u2Tasks.length} tasks for ${user2.email}`);

  const totalTasks = u1Tasks.length + u2Tasks.length;
  console.log(`\nSeeding complete. Summary:`);
  console.log(`  Users   : 2`);
  console.log(`  Tags    : 4`);
  console.log(`  Tasks   : ${totalTasks}`);
  console.log(`\nDemo credentials:`);
  console.log(`  demo@taskflow.com  / demo123`);
  console.log(`  user2@taskflow.com / user123`);
}

// ── Run ───────────────────────────────────────────────────────────────────────
main()
  .catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
