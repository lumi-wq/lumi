/** @type {import('next').NextConfig} */

const TYPE_CLUSTER = {
  outerwear: "verkhniy-odyag",
  sportswear: "sportyvni-kostyumy",
  suits: "kostyumy",
  sets: "komplekty",
  tshirts: "futbolky",
  shirts: "sorochky",
  hoodies: "khudi",
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
    "sets",
    "tshirts",
    "hoodies",
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
    "sets",
    "tshirts",
    "shirts",
    "hoodies",
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
      { source: "/product/shorty-kotonovi-ayugi-denim", destination: "/product/shorty-kotonovi", permanent: true },
      { source: "/product/komplekt-minnie-figaro", destination: "/product/komplekt-futbolka-losiny-prynt", permanent: true },
      { source: "/product/komplekt-bloom", destination: "/product/komplekt-futbolka-losiny-kvity", permanent: true },
      { source: "/product/sportyvnyi-kostium-ayugi", destination: "/product/sportyvnyi-kostium-z-dvonytky", permanent: true },
      { source: "/product/shorty-dzhynsovi-ayugi-jeans", destination: "/product/shorty-dzhynsovi", permanent: true },
      { source: "/product/shorty-dzhynsovi-ayugi-jeans-2", destination: "/product/shorty-dzhynsovi-2", permanent: true },
      { source: "/product/komplekt-tweety", destination: "/product/komplekt-futbolka-losiny-zhovtyi-prynt", permanent: true },
      { source: "/product/komplekt-futbolka-shorty-polo", destination: "/product/komplekt-futbolka-shorty", permanent: true },
      { source: "/product/komplekt-minnie", destination: "/product/komplekt-futbolka-losiny-serdechka", permanent: true },
      { source: "/product/komplekt-minnie-banty", destination: "/product/komplekt-futbolka-losiny-banty", permanent: true },
      { source: "/product/komplekt-daisy", destination: "/product/komplekt-futbolka-losiny-rozhevyi-prynt", permanent: true },
      { source: "/product/komplekt-dumbo", destination: "/product/komplekt-futbolka-losiny-slonyk", permanent: true },
      { source: "/product/vitrovka-nike", destination: "/product/vitrovka", permanent: true },
      { source: "/product/vitrovka-tommy-hilfiger", destination: "/product/vitrovka-z-kapiushonom", permanent: true },
      { source: "/product/komplekt-mickey-minnie", destination: "/product/komplekt-futbolka-shorty-prynt", permanent: true },
      { source: "/product/komplekt-flamingo", destination: "/product/komplekt-futbolka-velosypedky-flaminho", permanent: true },
      { source: "/product/shorty-wanex", destination: "/product/shorty-zhovti", permanent: true },
      { source: "/product/shorty-wanex-2", destination: "/product/shorty-chervoni", permanent: true },
      { source: "/product/shorty-dzhynsovi-wanex", destination: "/product/shorty-dzhynsovi-3", permanent: true },
      { source: "/product/lonhsliv-v-styli-polo", destination: "/product/lonhsliv-z-komirom", permanent: true },
      { source: "/category/kids", destination: "/category/new", permanent: true },
      { source: "/category/kidswear", destination: "/", permanent: true },
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
