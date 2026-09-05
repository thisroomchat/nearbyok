import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Seo title="Page not found — nearbyok.com" description="The page you are looking for does not exist." />
      <Header />
      <main className="flex-1 flex items-center justify-center p-8" data-testid="not-found-page">
        <div className="text-center max-w-md">
          <p className="text-7xl font-extrabold text-slate-200">404</p>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-2">Page not found</h1>
          <p className="text-sm text-slate-500 mt-2">The page you're looking for doesn't exist or has moved.</p>
          <Link to="/" className="inline-block mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-lg text-sm">Back to home</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
