import "dotenv/config";
import { connectDB, User } from "@repo/db";

async function run() {
  connectDB(String(process.env.MONGO_URI), String(process.env.MONGO_DB_NAME));

  const email = String(process.env.SEED_ADMIN_EMAIL);
  const password = String(process.env.SEED_ADMIN_PASSWORD);
  const name = String(process.env.SEED_ADMIN_NAME);
  const image = String(process.env.SEED_ADMIN_IMAGE);

  const existing = await User.findOne({email}).lean();
  if (existing) {
    console.log("Admin already exists:", email);
    process.exit(0);
  }

  const admin = await User.create({
    name,
    email,
    password,
    role: "admin",
    image,
    emailVerified: new Date(),
  });

  console.log("Created admin:", admin.email, "id:", admin._id);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});