import express from "express";
import { userSignupSchema, websiteUrlSchema } from "./models";
import { prisma } from "@repo/database/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { auth } from "./utils/middleware";
import cors from "cors";

const app = express();
const port = 8000;

app.use(express.json());
app.use(cors())

app.post("/signup", async (req, res) => {
  try {
    const parsed = userSignupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid inputs" });
    }

    const { username, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { username, password: hashedPassword } });

    return res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const parsed = userSignupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid inputs" });
    }

    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "3h",
    });

    return res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


app.get("/websites", auth, async (req, res) => {
  try {
    const websites = await prisma.website.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      include: {
        ticks: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { region: true },
        },
      },
    });

    return res.status(200).json({ websites });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/add-website", auth, async (req, res) => {
  try {
    const parsed = websiteUrlSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid URL" });
    }

    const website = await prisma.website.create({
      data: { userId: req.userId, url: parsed.data.url },
    });

    return res.status(201).json({
      website_id: website.id,
      message: "Website tracking started",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/get-status/:website_id", auth, async (req, res) => {
  try {
    const websiteId = req.params.website_id;

    const website = await prisma.website.findFirst({
      where: { id: websiteId, userId: req.userId },
      include: {
        ticks: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { region: true },
        },
      },
    });

    if (!website) {
      return res.status(404).json({ message: "Website not found" });
    }

    return res.status(200).json({
      websiteId: website.id,
      url: website.url,
      ticks: website.ticks,          // full list for chart + history
      latestTick: website.ticks[0] ?? null,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});