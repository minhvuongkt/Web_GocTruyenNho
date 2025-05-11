import { db } from "../server/db";
import {
  advertisements,
  externalAdConfigs,
  paymentSettings,
} from "../shared/schema";

async function populateAdsAndPayments() {
  console.log("Starting to populate ads and payment data...");

  try {
    // Create sample advertisements
    const adData = [
      {
        title: "Premium Membership",
        imageUrl: "/uploads/ads/premium-membership.jpg",
        targetUrl: "/premium",
        position: "top",
        displayOrder: 1,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
        width: 728,
        height: 90,
        provider: "internal",
      },
      {
        title: "New Manga Release",
        imageUrl: "/uploads/ads/new-manga.jpg",
        targetUrl: "/content/1",
        position: "right",
        displayOrder: 1,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
        width: 300,
        height: 600,
        provider: "internal",
      },
      {
        title: "Novel Promotion",
        imageUrl: "/uploads/ads/novel-promo.jpg",
        targetUrl: "/content/3",
        position: "popup",
        displayOrder: 1,
        startDate: new Date(),
        endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        isActive: true,
        width: 500,
        height: 500,
        displayFrequency: 60,
        provider: "internal",
      },
    ];

    for (const ad of adData) {
      const [existingAd] = await db.select().from(advertisements)
        .where(advertisements.title === ad.title);
        
      if (!existingAd) {
        await db.insert(advertisements).values(ad);
      }
    }
    
    console.log("Created advertisements");

    // Create sample external ad configs
    const externalAdData = [
      {
        name: "Google AdSense Header",
        provider: "google",
        scriptContent: `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
        <ins class="adsbygoogle"
          style="display:block"
          data-ad-client="ca-pub-1234567890"
          data-ad-slot="1234567890"
          data-ad-format="auto"></ins>
        <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`,
        position: "top",
        adUnitId: "ca-pub-1234567890",
        slotId: "1234567890",
        publisherId: "ca-pub-1234567890",
        isActive: true,
        width: 728,
        height: 90,
        format: "auto",
        isMobileEnabled: true,
      },
      {
        name: "Facebook Sidebar Ad",
        provider: "facebook",
        scriptContent: `<div id="fb-root"></div>
        <script async defer crossorigin="anonymous" src="https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v10.0&appId=your-app-id"></script>
        <div class="fb-page" data-href="https://www.facebook.com/facebook" data-tabs="" data-width="" data-height="" data-small-header="false" data-adapt-container-width="true" data-hide-cover="false" data-show-facepile="true">
          <blockquote cite="https://www.facebook.com/facebook" class="fb-xfbml-parse-ignore">
            <a href="https://www.facebook.com/facebook">Facebook</a>
          </blockquote>
        </div>`,
        position: "right",
        adUnitId: null,
        slotId: null,
        publisherId: "facebook-page-id",
        isActive: true,
        width: 300,
        height: 500,
        format: "vertical",
        isMobileEnabled: false,
      },
    ];

    for (const ad of externalAdData) {
      const [existingAd] = await db.select().from(externalAdConfigs)
        .where(externalAdConfigs.name === ad.name);
        
      if (!existingAd) {
        await db.insert(externalAdConfigs).values(ad);
      }
    }
    
    console.log("Created external ad configs");

    // Create payment settings
    const [existingPaymentSettings] = await db.select().from(paymentSettings);
    
    if (!existingPaymentSettings) {
      await db.insert(paymentSettings).values({
        bankConfig: {
          bankName: "Example Bank",
          accountNumber: "1234567890",
          accountName: "Website Account",
          bankBranch: "Main Branch",
        },
        vietQRConfig: {
          bankId: "EXBANK",
          accountNumber: "1234567890",
          accountName: "Website Account",
          template: "compact",
        },
        payosConfig: {
          clientId: "your-client-id",
          apiKey: "your-api-key",
          checksumKey: "your-checksum-key",
          baseUrl: "https://api-merchant.payos.vn",
        },
        priceConfig: {
          coinExchangeRate: 10, // 1 coin = 10 currency units
          standardChapterPrice: 50, // Standard price in coins for locked chapters
          premiumChapterPrice: 100, // Premium price in coins for special chapters
          discountRate: 0.1, // 10% discount for bulk purchases
        },
        emailConfig: {
          smtpHost: "smtp.example.com",
          smtpPort: 587,
          smtpUser: "noreply@example.com",
          smtpPass: "smtp-password",
          senderEmail: "noreply@example.com",
          adminEmail: "admin@example.com",
        },
        expiryConfig: {
          bankTransfer: 15, // 15 minutes
          payos: 30, // 30 minutes
        },
      });
    }
    
    console.log("Created payment settings");

    console.log("Ads and payment data population completed successfully!");
  } catch (error) {
    console.error("Error populating ads and payment data:", error);
  }
}

populateAdsAndPayments().catch(console.error);