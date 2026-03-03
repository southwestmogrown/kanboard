import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo users
  const password = await bcrypt.hash("password123", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@example.com",
      password,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "bob@example.com",
      password,
    },
  });

  // Create a demo board
  const board = await prisma.board.create({
    data: {
      title: "Project Alpha",
      ownerId: alice.id,
      members: {
        create: [
          { userId: alice.id, role: "OWNER" },
          { userId: bob.id, role: "EDITOR" },
        ],
      },
      columns: {
        create: [
          {
            title: "To Do",
            position: 0,
            cards: {
              create: [
                {
                  title: "Set up CI/CD pipeline",
                  description:
                    "Configure GitHub Actions for automated testing and deployment",
                  position: 0,
                },
                {
                  title: "Design landing page",
                  description:
                    "Create wireframes and mockups for the main marketing page",
                  position: 1,
                },
                { title: "Write API documentation", position: 2 },
              ],
            },
          },
          {
            title: "In Progress",
            position: 1,
            cards: {
              create: [
                {
                  title: "Implement user authentication",
                  description: "Email/password + OAuth with GitHub and Google",
                  position: 0,
                  assigneeId: alice.id,
                },
                {
                  title: "Build drag & drop",
                  description:
                    "Native HTML5 drag and drop for cards between columns",
                  position: 1,
                  assigneeId: bob.id,
                },
              ],
            },
          },
          {
            title: "Review",
            position: 2,
            cards: {
              create: [
                {
                  title: "Database schema design",
                  description: "Finalize Prisma schema with all relations",
                  position: 0,
                  assigneeId: alice.id,
                },
              ],
            },
          },
          {
            title: "Done",
            position: 3,
            cards: {
              create: [
                {
                  title: "Project scaffolding",
                  description: "Next.js + TypeScript + Tailwind + Prisma",
                  position: 0,
                },
                { title: "Set up WebSocket server", position: 1 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log(`✅ Created board "${board.title}" with 4 columns`);
  console.log(
    `👤 Demo users: alice@example.com / bob@example.com (password: password123)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
