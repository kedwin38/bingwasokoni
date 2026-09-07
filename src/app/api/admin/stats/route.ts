import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, handleApiError } from "@/lib/api-guard";

export async function GET() {
  try {
    await requireAdmin();

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalRevenueAgg,
      revenue24hAgg,
      successCount,
      pendingCount,
      failedCount,
      newMessages,
      totalPackages,
      totalAdmins,
      recentTransactions,
      dailySeries,
    ] = await Promise.all([
      prisma.transaction.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
      prisma.transaction.aggregate({
        where: { status: "SUCCESS", createdAt: { gte: since24h } },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where: { status: "SUCCESS" } }),
      prisma.transaction.count({ where: { status: "PENDING" } }),
      prisma.transaction.count({ where: { status: { in: ["FAILED", "TIMEOUT", "CANCELLED"] } } }),
      prisma.contactMessage.count({ where: { status: "NEW" } }),
      prisma.package.count({ where: { isActive: true } }),
      prisma.admin.count(),
      prisma.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { package: true },
      }),
      prisma.transaction.findMany({
        where: { status: "SUCCESS", createdAt: { gte: since7d } },
        select: { amount: true, createdAt: true },
      }),
    ]);

    const byDay: Record<string, number> = {};
    for (const t of dailySeries) {
      const key = t.createdAt.toISOString().slice(0, 10);
      byDay[key] = (byDay[key] ?? 0) + t.amount;
    }

    return NextResponse.json({
      totalRevenue: totalRevenueAgg._sum.amount ?? 0,
      revenue24h: revenue24hAgg._sum.amount ?? 0,
      successCount,
      pendingCount,
      failedCount,
      newMessages,
      totalPackages,
      totalAdmins,
      recentTransactions,
      revenueByDay: Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, amount]) => ({ date, amount })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
