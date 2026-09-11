import { getRevocationRequests, getRevocationRequestStats } from "@/features/admin/queries";
import { RevocationRequestsContainer } from "./RevocationRequestsContainer";

export const metadata = {
  title: "Revocation Requests | DevPair Admin",
  description: "Moderation queue for student ban and withdrawal cooldown revocation appeals.",
};

interface AdminRevocationRequestsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    restrictionType?: string;
  }>;
}

export default async function AdminRevocationRequestsPage({
  searchParams,
}: AdminRevocationRequestsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10) || 1;
  const search = params.search || "";
  const status = params.status || "all";
  const restrictionType = params.restrictionType || "all";

  const [result, stats] = await Promise.all([
    getRevocationRequests({
      page,
      pageSize: 20,
      search,
      status,
      restrictionType,
    }),
    getRevocationRequestStats(),
  ]);

  return (
    <RevocationRequestsContainer
      initialData={result.data}
      total={result.total}
      page={result.page}
      pageSize={result.pageSize}
      totalPages={result.totalPages}
      stats={stats}
      currentStatus={status}
      currentType={restrictionType}
      currentSearch={search}
    />
  );
}
