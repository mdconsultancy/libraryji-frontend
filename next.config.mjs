/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    images: { unoptimized: true },
    // three.js / @react-three/fiber define some classes that extend
    // browser-only globals at module-evaluation time — bundling them into
    // the server build (even for a component only ever rendered client-side
    // via `dynamic(..., { ssr: false })`) crashes Next's page-data
    // collection step with "Class extends value undefined is not a
    // constructor". Marking them external skips that server-side bundling.
    serverExternalPackages: ["three", "@react-three/fiber"],
};

export default nextConfig;
