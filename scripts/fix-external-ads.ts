import { db } from "../server/db";
import { externalAdConfigs } from "../shared/schema";
import { eq } from "drizzle-orm";

async function fixExternalAds() {
  console.log("Starting to fix external ad configs...");

  try {
    // Fix external ad script content
    // Update Google AdSense ad with safer HTML
    const googleAd = await db.update(externalAdConfigs)
      .set({
        scriptContent: `
        <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; padding: 10px; text-align: center;">
          <div>
            <div style="font-weight: bold; color: #4285f4;">Google AdSense Mockup</div>
            <div style="margin-top: 5px; font-size: 12px; color: #666;">Ad will appear here - 728x90</div>
          </div>
        </div>
        `
      })
      .where(eq(externalAdConfigs.provider, "google"))
      .returning();
    
    console.log(`Updated ${googleAd.length} Google ads`);

    // Update Facebook ad with safer HTML
    const facebookAd = await db.update(externalAdConfigs)
      .set({
        scriptContent: `
        <div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background-color: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; padding: 10px; text-align: center;">
          <div>
            <div style="font-weight: bold; color: #3b5998;">Facebook Ad Mockup</div>
            <div style="margin-top: 5px; font-size: 12px; color: #666;">Facebook ad will appear here - 300x500</div>
          </div>
        </div>
        `
      })
      .where(eq(externalAdConfigs.provider, "facebook"))
      .returning();
    
    console.log(`Updated ${facebookAd.length} Facebook ads`);

    console.log("External ad configs fixed successfully!");
  } catch (error) {
    console.error("Error fixing external ad configs:", error);
  }
}

fixExternalAds().catch(console.error);