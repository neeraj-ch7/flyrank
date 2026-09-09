import "./globals.css";

export const metadata = {
  title: "AI Decision Flow",
  description: "Visual AI decision workflows, executed through Inngest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
