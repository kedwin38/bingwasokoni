import { prisma } from "@/lib/prisma";

export type AssistantPackage = {
  id: string;
  name: string;
  price: number;
  amountLabel: string;
  validity: string;
  badge: string | null;
  categorySlug: string;
  categoryName: string;
};

export type AssistantResult = {
  reply: string;
  recommendations: AssistantPackage[];
};

async function loadCatalog(): Promise<AssistantPackage[]> {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { packages: { where: { isActive: true } } },
  });
  return categories.flatMap((cat) =>
    cat.packages.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      amountLabel: p.amountLabel,
      validity: p.validity,
      badge: p.badge,
      categorySlug: cat.slug,
      categoryName: cat.name,
    })),
  );
}

function extractBudget(message: string): number | null {
  const match = message.match(/(?:ksh|kes|sh)?\s*(\d{2,4})/i);
  return match ? parseInt(match[1], 10) : null;
}

function detectCategory(message: string): string | null {
  const m = message.toLowerCase();
  if (/(sms|text message|texting)/.test(m)) return "sms";
  if (/(minute|call|talk\s*time|airtime for calls)/.test(m)) return "minutes";
  if (/(combo|bundle deal|tunukiwa|everything|all in one)/.test(m)) return "combo";
  if (/(data|internet|browse|browsing|stream|video|whatsapp|social|youtube|tiktok)/.test(m))
    return "data";
  return null;
}

function detectDuration(message: string): "short" | "day" | "week" | null {
  const m = message.toLowerCase();
  if (/(hour|hr|midnight|quick|now|short)/.test(m)) return "short";
  if (/(week|7 day)/.test(m)) return "week";
  if (/(day|24|today|daily)/.test(m)) return "day";
  return null;
}

function isGreeting(m: string) {
  return /^(hi|hey|hello|habari|niaje|mambo)\b/i.test(m.trim());
}

export async function askAssistant(message: string): Promise<AssistantResult> {
  const catalog = await loadCatalog();
  const trimmed = message.trim();

  if (!trimmed || isGreeting(trimmed)) {
    const bestSellers = catalog.filter((p) => p.badge).slice(0, 3);
    return {
      reply:
        "Hi! I'm your Berna Gee assistant. Tell me what you need — e.g. \"cheap data for streaming under 60 bob\" or \"minutes bundle for the week\" — and I'll pick the best deal for you.",
      recommendations: bestSellers.length ? bestSellers : catalog.slice(0, 3),
    };
  }

  const budget = extractBudget(trimmed);
  const category = detectCategory(trimmed);
  const duration = detectDuration(trimmed);

  let candidates = catalog;
  if (category) candidates = candidates.filter((p) => p.categorySlug === category);
  if (budget) candidates = candidates.filter((p) => p.price <= budget);
  if (duration === "short") {
    candidates = candidates.filter((p) => /hour|hr|midnight/i.test(p.validity));
  } else if (duration === "week") {
    candidates = candidates.filter((p) => /week|7 day/i.test(p.validity));
  } else if (duration === "day") {
    candidates = candidates.filter((p) => /24|day/i.test(p.validity));
  }

  if (candidates.length === 0) {
    candidates = catalog.filter((p) => (category ? p.categorySlug === category : true));
  }
  if (candidates.length === 0) candidates = catalog;

  candidates = [...candidates].sort((a, b) => a.price - b.price).slice(0, 4);

  const parts: string[] = [];
  if (category) parts.push(category === "data" ? "data bundles" : category);
  if (budget) parts.push(`around Ksh ${budget} or less`);
  if (duration) {
    parts.push(
      duration === "short" ? "for a short window" : duration === "week" ? "for the week" : "for the day",
    );
  }

  const intro = parts.length
    ? `Here's what I'd recommend for ${parts.join(", ")}:`
    : "Here are a few solid options based on what you said:";

  const lines = candidates.map(
    (p) => `• ${p.name} — ${p.amountLabel} (${p.validity}) at Ksh ${p.price}`,
  );

  return {
    reply: `${intro}\n\n${lines.join("\n")}\n\nTap a card below to buy instantly with M-Pesa.`,
    recommendations: candidates,
  };
}
