/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow HMR when opening the app via LAN IP (e.g. http://10.138.194.41:3000)
  allowedDevOrigins: ["10.138.194.41", "localhost", "127.0.0.1"],
  serverExternalPackages: ["@prisma/client"],
  experimental: {
    optimizePackageImports: [
      "@mui/material",
      "@mui/icons-material",
      "lucide-react",
      "recharts",
    ],
  },
};

export default nextConfig;
