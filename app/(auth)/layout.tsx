export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="relative grid min-h-screen w-full lg:grid-cols-2">{children}</div>
    </div>
  );
}
