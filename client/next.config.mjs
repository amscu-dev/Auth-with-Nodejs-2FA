/** @type {import('next').NextConfig} */

const jiti = createJiti(fileURLToPath(import.meta.url));

jiti("./env");
const nextConfig = {};

export default nextConfig;
