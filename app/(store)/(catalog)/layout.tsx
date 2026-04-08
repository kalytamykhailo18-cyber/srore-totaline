import CategorySidebar from "../../components/CategorySidebar";

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 max-w-7xl w-full mx-auto">
      <CategorySidebar />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
