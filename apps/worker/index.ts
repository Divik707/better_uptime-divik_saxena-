import { xReadfGroup, xAckBulk } from "@repo/redisstreams/redis";
import { prisma } from "@repo/database/client";
import axios from "axios";

const REGION_ID = process.env.REGION_ID!;
const WORKER_ID = process.env.WORKER_ID!;

if (!REGION_ID) {
    throw new Error("REGION_ID missing");
}

if (!WORKER_ID) {
    throw new Error("WORKER_ID missing");
}

async function main() {
    while (true) {
        const res = await xReadfGroup(REGION_ID, WORKER_ID);

        if (!res || res.length === 0) {
            continue;
        }
        //@ts-ignore
        const promises = res.map(({ message }) =>
            fetchWebsite({
                url: message.url,
                websiteId: message.id,
            })
        );

        await Promise.all(promises);

        await xAckBulk(
            REGION_ID,
            //@ts-ignore
            res.map(({ id }) => id)
        );
    }
}

async function fetchWebsite({
    url,
    websiteId,
}: {
    url: string;
    websiteId: string;
}) {
    const startTime = Date.now();

    try {
        await axios.get(url);

        const endTime = Date.now();

        await prisma.websiteTick.create({
            data: {
                responseTimeInMs: endTime - startTime,
                status: "UP",
                regionId: REGION_ID,
                websiteId,
            },
        });
    } catch {
        const endTime = Date.now();

        await prisma.websiteTick.create({
            data: {
                responseTimeInMs: endTime - startTime,
                status: "DOWN",
                regionId: REGION_ID,
                websiteId,
            },
        });
    }
}

main();