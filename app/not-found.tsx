import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="font-display text-2xl font-bold text-cl-white">
        Page not found
      </h1>
      <p className="mt-2 text-sm text-cl-muted">
        That route isn’t in the app yet.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-cl-blue px-5 py-2 text-sm font-semibold text-night-950"
      >
        Back home
      </Link>
    </div>
  );
}
