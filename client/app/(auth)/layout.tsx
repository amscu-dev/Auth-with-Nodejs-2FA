import BackgroundGradient from "@/components/background/BackgroundGradient";

function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full h-full">
      <BackgroundGradient />
      {children}
    </div>
  );
}

export default AuthLayout;
