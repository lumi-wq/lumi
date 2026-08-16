/** @type {import('next').NextConfig} */

const TYPE_CLUSTER = {
  outerwear: "verkhniy-odyag",
  sportswear: "sportyvni-kostyumy",
  tshirts: "futbolky",
  pants: "shtany",
  dresses: "sukni",
  footwear: "vzuttya",
  hats: "shapky",
  caps: "kepky",
  bags: "sumky",
  glasses: "okulyary",
};

const TYPE_REDIRECT_PARENTS = {
  girls: ["outerwear", "sportswear", "tshirts", "pants", "dresses", "footwear", "hats", "caps", "bags"],
  boys: ["outerwear", "sportswear", "tshirts", "pants", "footwear", "hats", "caps", "bags"],
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
