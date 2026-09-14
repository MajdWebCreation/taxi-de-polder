import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mysql2 laadt onderdelen via dynamische requires; buiten de server-bundle
  // houden voorkomt dat die op Vercel stukgaan.
  serverExternalPackages: ["mysql2"],
};

export default nextConfig;
