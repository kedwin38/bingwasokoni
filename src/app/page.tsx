import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/client/SiteHeader";
import { Hero } from "@/components/client/Hero";
import { PackageBrowser } from "@/components/client/PackageBrowser";
import { HowItWorks } from "@/components/client/HowItWorks";
import { SiteFooter } from "@/components/client/SiteFooter";
import { ContactPanel } from "@/components/client/ContactPanel";
import { AIAssistant } from "@/components/client/AIAssistant";

export const dynamic = "force-dynamic";

async function getSettings() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  return (
    settings ?? {
      businessName: "Berna Gee",
      tagline: "Warm. Reliable. Customer-Friendly. 24/7 Support.",
      supportPhone: "0768050573",
      whatsappPhone: "0768050573",
    }
  );
}

export default async function Home() {
  const settings = await getSettings();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader settings={settings} />
      <main className="flex-1">
        <Hero settings={settings} />
        <PackageBrowser />
        <HowItWorks />
      </main>
      <SiteFooter settings={settings} />
      <ContactPanel />
      <AIAssistant />
    </div>
  );
}
