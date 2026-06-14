import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      prisma.loanApplication.findMany({
        where,
        include: {
          riskDocuments: true,
          confirmation: {
            include: {
              operator: true,
            },
          },
          exceptions: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.loanApplication.count({ where }),
    ]);

    return NextResponse.json({
      data,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("获取借款申请列表失败:", error);
    return NextResponse.json(
      { error: "获取借款申请列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { borrowerName, borrowerPhone, amount, purpose } = body;

    const application = await prisma.loanApplication.create({
      data: {
        borrowerName,
        borrowerPhone,
        amount: parseFloat(amount),
        purpose,
        status: "PENDING",
      },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("创建借款申请失败:", error);
    return NextResponse.json(
      { error: "创建借款申请失败" },
      { status: 500 }
    );
  }
}