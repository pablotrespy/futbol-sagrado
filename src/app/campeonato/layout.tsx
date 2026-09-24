import { PublicHeader } from "@/components/public/public-header";
import { SubNav } from "@/components/public/sub-nav";

export default function CampeonatoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-stone-100">
      <PublicHeader />
      <SubNav />
      {children}
    </div>
  );
}
