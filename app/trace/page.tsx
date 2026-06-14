"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import Navbar from "@/components/Navbar";
import Timeline from "@/components/Timeline";
import { TimelineEvent } from "@/types";
import { ArrowLeft, FileText, Calendar } from "lucide-react";

export default function TracePage() {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string>("");
  const [businessType, setBusinessType] = useState<string>("");
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else {
      const id = searchParams.get("businessId");
      if (id) {
        setBusinessId(id);
        fetchTimeline(id);
      }
    }
  }, [user, router, searchParams]);

  const fetchTimeline = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/trace/${id}`);
      const data = await response.json();
      setTimeline(data.timeline || []);
      setBusinessType(data.businessType || "APPLICATION");
    } catch (error) {
      console.error("获取业务流程历史失败:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-2">
            {businessType === "APPLICATION" ? (
              <FileText className="w-8 h-8 text-primary" />
            ) : (
              <Calendar className="w-8 h-8 text-primary" />
            )}
            <h1 className="text-3xl font-bold text-primary">数据追溯</h1>
          </div>
          <p className="text-gray-600">查看完整的业务流程历史记录</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="text-gray-500 mt-4">加载中...</p>
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <p className="text-gray-500">暂无历史记录</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <div className="text-sm text-gray-500 mb-2">
                业务ID: {businessId}
              </div>
              <div className="text-sm text-gray-500">
                业务类型: {businessType === "APPLICATION" ? "借款申请" : "还款计划"}
              </div>
            </div>

            <div className="border-l-2 border-gray-200 pl-4">
              <Timeline events={timeline} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}