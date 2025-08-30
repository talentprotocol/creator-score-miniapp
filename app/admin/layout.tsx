import "../globals.css";
import "@coinbase/onchainkit/styles.css";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <div className="min-h-screen bg-background">
          <main className="min-h-screen">{children}</main>
        </div>
      </body>
    </html>
  );
}
