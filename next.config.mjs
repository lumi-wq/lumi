/** @type {import('next').NextConfig} */

const TYPE_CLUSTER = {
  outerwear: "verkhniy-odyag",
  sportswear: "sportyvni-kostyumy",
  suits: "kostyumy",
  tshirts: "futbolky",
  pants: "shtany",
  shorts: "shorty",
  dresses: "sukni",
  footwear: "vzuttya",
  hats: "shapky",
  caps: "kepky",
  bags: "sumky",
  glasses: "okulyary",
};

const TYPE_REDIRECT_PARENTS = {
  girls: [
    "outerwear",
    "sportswear",
    "suits",
    "tshirts",
    "pants",
    "shorts",
    "dresses",
    "footwear",
    "hats",
    "caps",
    "bags",
  ],
  boys: [
    "outerwear",
    "sportswear",
    "suits",
    "tshirts",
    "pants",
    "shorts",
    "footwear",
    "hats",
    "caps",
    "bags",
  ],
  accessories: ["hats", "caps", "bags", "glasses"],
};

const typeRedirects = Object.entries(TYPE_REDIRECT_PARENTS).flatMap(([parent, types]) =>
  types.map((type) => ({
    source: `/category/${parent}`,
    has: [{ type: "query", key: "type", value: type }],
    destination: `/category/${parent}/${TYPE_CLUSTER[type]}`,
    permanent: true,
  }))
);

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.blob.vercel-storage.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/category/kids", destination: "/category/new", permanent: true },
      { source: "/category/teens", destination: "/category/pidlitkovyy-odyag", permanent: true },
      {
        source: "/category/new",
        has: [{ type: "query", key: "type", value: "accessories" }],
        destination: "/category/accessories",
        permanent: false,
      },
      ...typeRedirects,
    ];
  },
};

export default nextConfig;
