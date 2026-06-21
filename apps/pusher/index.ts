import { prisma } from "@repo/database/client";
import { xAddBulk } from "@repo/redisstreams/redis";

async function main() {
    let websites = await prisma.website.findMany(
        {
            select: 
            {
                id: true,
                url : true
            }
        }
    )

    xAddBulk(websites.map((w: {url: string, id: string})  => ({
        url: w.url,
        id: w.id
    })))
}

setInterval( () => {
    main()
}, 3 * 1000 * 60)


main()