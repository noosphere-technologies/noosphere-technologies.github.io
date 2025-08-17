import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.union([z.string(), z.date()]).transform(str => new Date(str)),
		updatedDate: z.union([z.string(), z.date()]).transform(str => new Date(str)).optional(),
		author: z.string().default('Unknown'),
	}),
});

export const collections = { blog };