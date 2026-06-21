import { string, z } from "zod";

export const userSignupSchema = z.object({
    username: z.string(),
    password: z.string()
})

export const websiteUrlSchema = z.object({
    url: string().url()
})