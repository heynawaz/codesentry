import { PageLoading } from "@/components/ui/page-loading";

export default function PRDetailLoading() {
  return <PageLoading message="Loading pull request…" useSkeleton />;
}
