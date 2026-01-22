import "dotenv/config";
import { Option } from "./option";
import { XMLParser } from "fast-xml-parser";
import he from "he";
import { bggThingStatements } from "./database";

interface BGGOption extends Option {
  attributes: BGGThingAttributes;
}

export class BGG {
  private static readonly bggApiUrl = process.env.BGG_API_URL || "";
  private static readonly bggApiToken = process.env.BGG_API_TOKEN || "";
  private static readonly bggAgeCacheInDays = parseInt(
    process.env.BGG_AGE_CACHE_IN_DAYS || "30",
  );

  private static fetchThingsByIds = async (idsToFetch: Array<string>) => {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const detailsUrl = `${this.bggApiUrl}/thing?id=${idsToFetch.join(",")}`;
    const detailsResponse = await fetch(detailsUrl, {
      method: "GET",
      headers: {
        //Accept: "application/xml",
        Authorization: `Bearer ${this.bggApiToken}`,
      },
    });
    const detailsData = await detailsResponse.text();
    const detailsJsonObj = parser.parse(detailsData);
    const detailItems = detailsJsonObj.items?.item;
    const detailItemsArray = Array.isArray(detailItems)
      ? detailItems
      : [detailItems];

    return detailItemsArray.map((detailItem: any) => {
      const id = detailItem["@_id"];

      // Handle both single name and array of names
      const namesArray = Array.isArray(detailItem.name)
        ? detailItem.name
        : [detailItem.name];
      const name =
        namesArray.find((n: any) => n["@_type"] === "primary")?.["@_value"] ||
        "Unknown";
      const type = detailItem["@_type"] || "unknown";
      const yearPublished = detailItem.yearpublished
        ? parseInt(detailItem.yearpublished["@_value"])
        : null;
      const thumbnailUrl = detailItem.thumbnail || null;
      const imageUrl = detailItem.image || null;

      const attributes: BGGThingAttributes = {
        type,
        yearPublished,
        thumbnailUrl,
        imageUrl,
      };

      const newBggThing = new BGGThing(id, name, attributes, new Date());
      newBggThing.save();

      return newBggThing;
    });
  };

  static async search(query: string): Promise<Array<BGGOption>> {
    const url = `${this.bggApiUrl}/search?query=${encodeURIComponent(query)}&type=boardgame`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        //Accept: "application/xml",
        Authorization: `Bearer ${this.bggApiToken}`,
      },
    });
    const data = await response.text();

    // Parse XML response to JSON
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    const jsonObj = parser.parse(data);

    const results: Array<BGGOption> = [];
    const items = jsonObj.items?.item;

    if (!items) {
      return results;
    }

    // Handle both single item and array of items
    const itemsArray = Array.isArray(items) ? items : [items];

    // Splice by range of 20 items
    for (let i = 0; i < itemsArray.length; i += 20) {
      const limitedItems = itemsArray.slice(i, i + 20);
      const idsToFetch: Array<string> = [];

      // Retreive details either from database or from BGG API
      limitedItems.forEach((item: any) => {
        const id = item["@_id"];
        const rawLabel = item.name?.["@_value"];

        if (id && rawLabel) {
          // Decode HTML entities (e.g., &#039; -> ')
          const label = he.decode(rawLabel);
          const bggThing = BGGThing.getBggThing(id);
          // Cache must be younger than X (30) days
          if (
            bggThing &&
            (new Date().getTime() - bggThing.last_updated_at.getTime()) /
              (1000 * 60 * 60 * 24) <
              this.bggAgeCacheInDays
          ) {
            results.push({ id, label, attributes: bggThing.attributes });
          } else {
            idsToFetch.push(id);
            results.push({
              id,
              label,
              attributes: {
                type: "",
                yearPublished: null,
                thumbnailUrl: null,
                imageUrl: null,
              },
            });
          }
        }
      });
      if (idsToFetch.length > 0) {
        await BGG.fetchThingsByIds(idsToFetch).then((fetchedThings) => {
          // Update results with fetched details
          fetchedThings.forEach((thing) => {
            // Update the result entry with fetched attributes
            const resultEntry = results.find((r) => r.id === thing.id);
            if (resultEntry) {
              resultEntry.attributes = thing.attributes;
            }
          });
        });
      }
    }

    // Filter results to only include boardgames
    return results.filter((r) => r.attributes.type === "boardgame");
  }

  public static async getThingById(id: string): Promise<BGGThing | null> {
    const bggThing = BGGThing.getBggThing(id);
    // Load from BGG API if not in cache or cache is too old
    if (
      !bggThing ||
      (new Date().getTime() - bggThing.last_updated_at.getTime()) /
        (1000 * 60 * 60 * 24) >=
        this.bggAgeCacheInDays
    ) {
      const fetchedThings = await BGG.fetchThingsByIds([id]);
      return fetchedThings.length > 0 ? fetchedThings[0] : null;
    }
    return bggThing;
  }
}

interface BGGThingAttributes {
  type: string;
  yearPublished: number | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
}

class BGGThing {
  id: string;
  name: string;
  attributes: BGGThingAttributes;
  last_updated_at: Date;

  constructor(
    id: string,
    name: string,
    attributes: BGGThingAttributes,
    last_updated_at: Date,
  ) {
    this.id = id;
    this.name = name;
    this.attributes = attributes;
    this.last_updated_at = last_updated_at;
  }

  public save() {
    const existing = bggThingStatements.getById.get(this.id);
    if (existing) {
      bggThingStatements.update.run({
        id: this.id,
        name: this.name,
        attributes: JSON.stringify(this.attributes),
      });
    } else {
      bggThingStatements.insert.run({
        id: this.id,
        name: this.name,
        attributes: JSON.stringify(this.attributes),
      });
    }
  }

  public static getBggThing(id: string): BGGThing | null {
    const row = bggThingStatements.getById.get(id) as any;

    if (!row) {
      return null;
    }

    const attributes = JSON.parse(row.attributes || "{}");
    return new BGGThing(row.id, row.name, attributes, new Date(row.updatedAt));
  }
}
