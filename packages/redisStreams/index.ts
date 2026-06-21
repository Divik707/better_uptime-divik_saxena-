import { createClient } from "redis";

const client = await createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379"
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

// ← delete the top-level xGroupCreate block, keep only this:
export async function initConsumerGroup(regionId: string) {
  try {
    await client.xGroupCreate("betteruptime", regionId, "$", { MKSTREAM: true });
  } catch (e: any) {
    if (!e.message.includes("BUSYGROUP")) throw e;
  }
}

const STREAM_NAME = "betteruptime";
type WebsiteInput = {
    url: string,
    id: string
}

async function xadd({url, id} :{
    url: string,
    id: string
}) {
    await client.xAdd(
        STREAM_NAME, '*' , { url, id }
    )
}

export async function xAddBulk(website: WebsiteInput[]) {
    for(let i = 0; i < website.length; i ++) {
        const url = website[i]?.url
        const id = website[i]?.id
        if(url && id)
            await xadd({ url , id })
    }
}

export async function xReadfGroup(consumerGroup: string, workerId: string) {
    const response = await client.xReadGroup(
        consumerGroup, workerId, 
        {
            key: STREAM_NAME,
            id: '>'
        }
    );
    if(!response) 
    {
        return 
    }
    let message = response[0]?.messages;
    return message
}

async function xAck(consumerGroup: string, eventId: string) {
    await client.xAck(STREAM_NAME, consumerGroup, eventId)
}

export async function xAckBulk(consumerGroup: string, eventIds: string[]) {
    eventIds.map(eventId => xAck(consumerGroup, eventId));
}