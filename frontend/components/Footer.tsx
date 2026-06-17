import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="font-bold text-ink">JobFIT</p>
          <p className="mt-1 text-sm text-slateSoft">AI-assisted job ranking for students and early-career talent.</p>
        </div>
        <div className="flex gap-5 text-sm font-medium text-slate-600">
          <Link href="/dashboard" className="hover:text-ink">
            Dashboard
          </Link>
          <Link href="/matches" className="hover:text-ink">
            Matches
          </Link>
          <Link href="/about" className="hover:text-ink">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
