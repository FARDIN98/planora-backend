import { prisma } from "../lib/prisma.js";

const CATEGORY_QUERIES: Record<string, string> = {
  PUBLIC_FREE: "community event gathering",
  PUBLIC_PAID: "conference professional event",
  PRIVATE_FREE: "private gathering meeting",
  PRIVATE_PAID: "exclusive private event",
  General: "event celebration",
};

function getCategoryQuery(visibility: string, type: string): string {
  const key = `${visibility}_${type}`;
  return CATEGORY_QUERIES[key] || CATEGORY_QUERIES["General"];
}

async function fetchUnsplashImage(category: string): Promise<string | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return null;
  }

  try {
    const query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES["General"];
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });

    if (!response.ok) {
      console.warn(`[unsplash] API returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.urls?.regular || null;
  } catch (error) {
    console.error("[unsplash] Failed to fetch image:", error);
    return null;
  }
}

async function ensureEventImage(
  eventId: string,
  visibility: string,
  type: string,
): Promise<string | null> {
  // Check if event already has an image
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { imageUrl: true },
  });

  if (!event) return null;

  // If image already exists, return it
  if (event.imageUrl) {
    return event.imageUrl;
  }

  // If UNSPLASH_ACCESS_KEY is not set, return null (graceful fallback)
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    return null;
  }

  // Fetch from Unsplash based on category
  const categoryKey = getCategoryQuery(visibility, type);
  const imageUrl = await fetchUnsplashImage(categoryKey);

  if (imageUrl) {
    // Cache the URL in the database
    await prisma.event.update({
      where: { id: eventId },
      data: { imageUrl },
    });
  }

  return imageUrl;
}

export const unsplashService = { fetchUnsplashImage, ensureEventImage };
