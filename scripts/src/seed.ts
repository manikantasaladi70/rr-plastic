import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";

const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "store", password: "store123", role: "store" },
];

for (const u of users) {
  const passwordHash = await bcrypt.hash(u.password, 10);
  await db.insert(usersTable)
    .values({ username: u.username, passwordHash, role: u.role })
    .onConflictDoNothing();
}
console.log("Seeded users successfully");
process.exit(0);