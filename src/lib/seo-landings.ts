import type { ProductGender } from "@prisma/client";
import { ACCESSORY_TYPE_SLUGS, PRODUCT_TYPE_DEFS } from "@/lib/product-types";
import { formatHeightSize } from "@/lib/sizes";
import { PRODUCT_TYPE_TO_CLUSTER } from "@/lib/seo-landing-paths";

export type SeoFaq = { q: string; a: string };

export type SeoLanding = {
  /** Батьківський розділ. `root` = `/category/{slug}` */
  parent: "girls" | "boys" | "accessories" | "root";
  slug: string;
  path: string;
  h1: string;
  name: string;
  title: string;
  description: string;
  intro: string;
  gender?: ProductGender;
  productTypeSlug?: string;
  productTypeSlugs?: readonly string[];
  /** Фільтр за ростом (см → «140 см») */
  sizes?: readonly string[];
  faq: SeoFaq[];
  related: { href: string; label: string }[];
};

const TYPE_SEO: Record<
  string,
  { slug: string; short: string; girlsIntro: string; boysIntro: string; allIntro: string }
> = {
  outerwear: {
    slug: PRODUCT_TYPE_TO_CLUSTER.outerwear,
    short: "Верхній одяг",
    girlsIntro:
      "Куртки, парки та вітровки для дівчаток 6–16 років — тепло в школу, на прогулянку і в міжсезоння. Дивіться ріст у таблиці розмірів і замовляйте на сайті з доставкою Новою Поштою.",
    boysIntro:
      "Верхній одяг для хлопчиків 6–16: куртки, парки, вітровки. Підбирайте за ростом, оплачуйте карткою онлайн — доставка Новою Поштою по Україні.",
    allIntro:
      "Дитячий верхній одяг 6–16 років: куртки, парки, вітровки. Купуйте на lumi.kids з доставкою Новою Поштою по Україні.",
  },
  sportswear: {
    slug: PRODUCT_TYPE_TO_CLUSTER.sportswear,
    short: "Спортивні костюми",
    girlsIntro:
      "Спортивні костюми для дівчаток — зручні на фізкультуру, секцію і щодень. Натуральні матеріали, розміри за ростом 6–16 років.",
    boysIntro:
      "Спортивні костюми для хлопчиків 6–16 років: зручна посадка, зносостійкість, легко прати. Замовлення і оплата на сайті.",
    allIntro:
      "Дитячі спортивні костюми 6–16 років. Зручно для школи, спорту і прогулянок. Доставка Новою Поштою по Україні.",
  },
  suits: {
    slug: PRODUCT_TYPE_TO_CLUSTER.suits,
    short: "Костюми",
    girlsIntro:
      "Костюми для дівчаток 6–16 років — на свято, у школу та на кожен день. Підбір за ростом, доставка Новою Поштою.",
    boysIntro:
      "Костюми для хлопчиків 6–16 років: святкові та повсякденні комплекти. Замовлення на сайті з доставкою по Україні.",
    allIntro: "Дитячі костюми 6–16 років. Купити онлайн в LUMI з доставкою Новою Поштою.",
  },
  sets: {
    slug: PRODUCT_TYPE_TO_CLUSTER.sets,
    short: "Комплекти",
    girlsIntro:
      "Комплекти для дівчаток — футболка з лосінами або шортами в одному сеті. Зручно на кожен день, доставка Новою Поштою.",
    boysIntro:
      "Комплекти для хлопчиків 6–16 років: футболка зі шортами або штанами. Замовлення на сайті з доставкою по Україні.",
    allIntro: "Дитячі комплекти 6–16 років. Купити онлайн в LUMI з доставкою Новою Поштою.",
  },
  tshirts: {
    slug: PRODUCT_TYPE_TO_CLUSTER.tshirts,
    short: "Футболки",
    girlsIntro:
      "Футболки для дівчаток 6–16 — база гардероба на кожен день і під жакет у школу. Обирайте розмір за ростом дитини.",
    boysIntro:
      "Футболки для хлопчиків 6–16 років: базова посадка, натуральні тканини. Швидке замовлення на сайті з доставкою по Україні.",
    allIntro:
      "Дитячі футболки 6–16 років. Базовий одяг для школи і дому. Купити онлайн з доставкою Новою Поштою.",
  },
  shirts: {
    slug: PRODUCT_TYPE_TO_CLUSTER.shirts,
    short: "Сорочки",
    girlsIntro: "",
    boysIntro:
      "Сорочки для хлопчиків 6–16 років — у школу та на кожен день. Підбір за ростом, доставка Новою Поштою по Україні.",
    allIntro: "Дитячі сорочки для хлопчиків 6–16 років. Купити онлайн в LUMI з доставкою Новою Поштою.",
  },
  pants: {
    slug: PRODUCT_TYPE_TO_CLUSTER.pants,
    short: "Штани",
    girlsIntro:
      "Штани для дівчаток 6–16 років — на кожен день і в школу. Дивіться наявні рости й замовляйте з оплатою карткою онлайн.",
    boysIntro:
      "Штани для хлопчиків 6–16: зручна посадка для школи, двору і прогулянок. Доставка Новою Поштою по Україні.",
    allIntro:
      "Дитячі штани 6–16 років. Купуйте онлайн на lumi.kids — доставка по Україні, оплата карткою.",
  },
  shorts: {
    slug: PRODUCT_TYPE_TO_CLUSTER.shorts,
    short: "Шорти",
    girlsIntro:
      "Шорти для дівчаток 6–16 років — для літа, двору і спорту. Обирайте за ростом і замовляйте на сайті.",
    boysIntro:
      "Шорти для хлопчиків 6–16 років: зручні на літо, прогулянки та активний відпочинок. Доставка Новою Поштою.",
    allIntro: "Дитячі шорти 6–16 років. Купити онлайн в LUMI з доставкою по Україні.",
  },
  dresses: {
    slug: PRODUCT_TYPE_TO_CLUSTER.dresses,
    short: "Сукні",
    girlsIntro:
      "Сукні для дівчаток 6–16 років — на кожен день, свято і школу. Підбір за ростом, доставка Новою Поштою.",
    boysIntro: "",
    allIntro: "Дитячі сукні 6–16 років. Замовляйте на сайті LUMI з доставкою по Україні.",
  },
  footwear: {
    slug: PRODUCT_TYPE_TO_CLUSTER.footwear,
    short: "Взуття",
    girlsIntro:
      "Взуття для дівчаток 6–16 років. Дивіться наявність розмірів і оформлюйте замовлення на сайті.",
    boysIntro:
      "Взуття для хлопчиків 6–16 років. Замовлення на lumi.kids, доставка Новою Поштою по Україні.",
    allIntro: "Дитяче взуття 6–16 років. Купити онлайн з доставкою по Україні.",
  },
  hats: {
    slug: PRODUCT_TYPE_TO_CLUSTER.hats,
    short: "Шапки",
    girlsIntro: "Шапки для дівчаток — до верхнього одягу на осінь і зиму. Замовляйте разом із курткою.",
    boysIntro: "Шапки для хлопчиків 6–16 років. Доставка Новою Поштою, оплата карткою онлайн.",
    allIntro: "Дитячі шапки. Аксесуари LUMI з доставкою по Україні.",
  },
  caps: {
    slug: PRODUCT_TYPE_TO_CLUSTER.caps,
    short: "Кепки",
    girlsIntro: "Кепки для дівчаток — літній аксесуар до футболки і спортивного костюма.",
    boysIntro: "Кепки для хлопчиків 6–16 років. Замовлення на сайті, доставка Новою Поштою.",
    allIntro: "Дитячі кепки. Купити онлайн в LUMI з доставкою по Україні.",
  },
  bags: {
    slug: PRODUCT_TYPE_TO_CLUSTER.bags,
    short: "Сумки",
    girlsIntro: "Сумки для дівчаток — до школи і на кожен день. Замовляйте на lumi.kids.",
    boysIntro: "Сумки для хлопчиків 6–16 років. Доставка Новою Поштою по Україні.",
    allIntro: "Дитячі сумки та аксесуари LUMI з доставкою по Україні.",
  },
  glasses: {
    slug: PRODUCT_TYPE_TO_CLUSTER.glasses,
    short: "Окуляри",
    girlsIntro: "Окуляри — універсальний аксесуар. Дивіться наявність і замовляйте на сайті.",
    boysIntro: "Окуляри — універсальний аксесуар. Замовлення на lumi.kids з доставкою по Україні.",
    allIntro: "Окуляри для дітей і підлітків. Доставка Новою Поштою по Україні.",
  },
};

const AGE_BANDS = [
  {
    slug: "6-8-rokiv",
    label: "6–8 років",
    shortWho: "молодших школярів",
    sizes: [110, 116, 122, 128].map(formatHeightSize),
    introExtra: "Орієнтир — ріст 110–130 см. Вік лише підказка: міряйте за таблицею розмірів.",
  },
  {
    slug: "9-12-rokiv",
    label: "9–12 років",
    shortWho: "школярів",
    sizes: [134, 140, 146, 152].map(formatHeightSize),
    introExtra: "Орієнтир — ріст 130–154 см. Якщо між розмірами — беріть більший.",
  },
  {
    slug: "13-16-rokiv",
    label: "13–16 років",
    shortWho: "підлітків",
    sizes: [158, 164, 170, 176, 182, 188, 190].map(formatHeightSize),
    introExtra: "Підліткові рости 154–180+ см. Посадка ближча до дорослої — дивіться таблицю.",
  },
] as const;

const CLOTHING_TYPES = [
  "outerwear",
  "sportswear",
  "suits",
  "sets",
  "tshirts",
  "shirts",
  "pants",
  "shorts",
  "dresses",
  "footwear",
] as const;
const GENDER_ACCESSORIES = ["hats", "caps", "bags"] as const;

export const DEFAULT_FAQ: SeoFaq[] = [
  {
    q: "Як підібрати розмір дитячого одягу?",
    a: "У LUMI основний орієнтир — ріст у сантиметрах, не вік. Порівняйте зріст дитини з таблицею розмірів. Якщо точного значення немає — оберіть найближчий більший розмір.",
  },
  {
    q: "Чи є доставка по Україні?",
    a: "Так. Доставка Новою Поштою у відділення або поштомат по Україні. Вартість і орієнтовна дата показуються під час оформлення замовлення на lumi.kids.",
  },
  {
    q: "Як оплатити замовлення?",
    a: "Оплата лише карткою онлайн на сайті (Visa, Mastercard, Apple Pay, Google Pay через plata by mono / Monobank). Післяплата не передбачена.",
  },
];

type GenderParent = "girls" | "boys";

const GENDER_META: Record<
  GenderParent,
  { gender: ProductGender; ua: string; uaGen: string; sibling: GenderParent }
> = {
  girls: { gender: "GIRL", ua: "дівчаток", uaGen: "дівчаткам", sibling: "boys" },
  boys: { gender: "BOY", ua: "хлопчиків", uaGen: "хлопчикам", sibling: "girls" },
};

function typeAllowedFor(parent: GenderParent, typeSlug: string): boolean {
  const def = PRODUCT_TYPE_DEFS.find((t) => t.slug === typeSlug);
  if (!def) return false;
  if (def.girlOnly && parent === "boys") return false;
  if ("boyOnly" in def && def.boyOnly && parent === "girls") return false;
  return true;
}

function typeLanding(
  parent: GenderParent,
  typeSlug: string,
  extraRelated: { href: string; label: string }[] = []
): SeoLanding | null {
  if (!typeAllowedFor(parent, typeSlug)) return null;
  const seo = TYPE_SEO[typeSlug];
  if (!seo) return null;
  const g = GENDER_META[parent];
  const intro = parent === "girls" ? seo.girlsIntro : seo.boysIntro;
  const name = `${seo.short} для ${g.ua}`;
  const path = `/category/${parent}/${seo.slug}`;
  return {
    parent,
    slug: seo.slug,
    path,
    name,
    h1: `${seo.short} для ${g.ua} 6–16 років`,
    title: `${seo.short} для ${g.ua} 6–16 купити в Україні`,
    description: `${seo.short} для ${g.ua} 6–16 років. Доставка Новою Поштою, оплата карткою онлайн. Інтернет-магазин LUMI.`,
    intro,
    gender: g.gender,
    productTypeSlug: typeSlug,
    faq: DEFAULT_FAQ,
    related: [
      { href: `/category/${parent}`, label: parent === "girls" ? "Увесь одяг для дівчаток" : "Увесь одяг для хлопчиків" },
      ...(typeAllowedFor(g.sibling, typeSlug)
        ? [
            {
              href: `/category/${g.sibling}/${seo.slug}`,
              label: `${seo.short} для ${GENDER_META[g.sibling].ua}`,
            },
          ]
        : []),
      { href: "/size-guide", label: "Таблиця розмірів" },
      ...extraRelated,
    ],
  };
}

function ageLanding(parent: GenderParent, band: (typeof AGE_BANDS)[number]): SeoLanding {
  const g = GENDER_META[parent];
  const name = `Одяг для ${g.ua} ${band.label}`;
  return {
    parent,
    slug: band.slug,
    path: `/category/${parent}/${band.slug}`,
    name,
    h1: `Одяг для ${g.ua} ${band.label}`,
    title: `Одяг для ${g.ua} ${band.label} купити в Україні`,
    description: `Дитячий одяг для ${g.ua} ${band.label} (${band.shortWho}). Підбір за ростом, доставка Новою Поштою. LUMI.`,
    intro: `Одяг LUMI для ${g.ua} ${band.label}. ${band.introExtra} Замовлення і оплата на сайті.`,
    gender: g.gender,
    sizes: band.sizes,
    faq: DEFAULT_FAQ,
    related: [
      { href: `/category/${parent}`, label: parent === "girls" ? "Дівчатка" : "Хлопчики" },
      { href: `/category/${g.sibling}/${band.slug}`, label: `Одяг для ${GENDER_META[g.sibling].ua} ${band.label}` },
      { href: "/size-guide", label: "Таблиця розмірів" },
    ],
  };
}

const SCHOOL_TYPES = ["tshirts", "pants", "dresses", "sportswear", "footwear"] as const;
const WINTER_TYPES = ["outerwear", "hats"] as const;
const SUMMER_TYPES = ["tshirts", "shorts", "dresses", "pants", "caps", "sets"] as const;

function filterTypesForGender(parent: GenderParent, types: readonly string[]): string[] {
  return types.filter((t) => typeAllowedFor(parent, t));
}

function intentLanding(
  parent: GenderParent,
  spec: {
    slug: string;
    nameCore: string;
    h1: string;
    intro: string;
    types: readonly string[];
    sizes?: readonly string[];
  }
): SeoLanding {
  const g = GENDER_META[parent];
  const types = filterTypesForGender(parent, spec.types);
  const name = `${spec.nameCore} для ${g.ua}`;
  return {
    parent,
    slug: spec.slug,
    path: `/category/${parent}/${spec.slug}`,
    name,
    h1: spec.h1.replace("{ua}", g.ua),
    title: `${spec.nameCore} для ${g.ua} купити в Україні`,
    description: `${spec.nameCore} для ${g.ua} 6–16 років. Доставка Новою Поштою по Україні. LUMI.`,
    intro: spec.intro.replaceAll("{ua}", g.ua),
    gender: g.gender,
    productTypeSlugs: types,
    sizes: spec.sizes,
    faq: DEFAULT_FAQ,
    related: [
      { href: `/category/${parent}`, label: parent === "girls" ? "Дівчатка" : "Хлопчики" },
      { href: `/category/${parent}/verkhniy-odyag`, label: "Верхній одяг" },
      { href: "/size-guide", label: "Таблиця розмірів" },
    ],
  };
}

function accessoryLanding(typeSlug: (typeof ACCESSORY_TYPE_SLUGS)[number]): SeoLanding {
  const seo = TYPE_SEO[typeSlug];
  return {
    parent: "accessories",
    slug: seo.slug,
    path: `/category/accessories/${seo.slug}`,
    name: seo.short,
    h1: `${seo.short} для дітей 6–16 років`,
    title: `${seo.short} дитячі купити в Україні`,
    description: `${seo.short} для дітей і підлітків. Доставка Новою Поштою. Інтернет-магазин LUMI.`,
    intro: seo.allIntro,
    productTypeSlug: typeSlug,
    faq: DEFAULT_FAQ,
    related: [
      { href: "/category/accessories", label: "Усі аксесуари" },
      { href: "/category/girls", label: "Одяг для дівчаток" },
      { href: "/category/boys", label: "Одяг для хлопчиків" },
    ],
  };
}

function rootTypeLanding(typeSlug: string): SeoLanding {
  const seo = TYPE_SEO[typeSlug];
  return {
    parent: "root",
    slug: seo.slug,
    path: `/category/${seo.slug}`,
    name: seo.short,
    h1: `${seo.short} для дітей 6–16 років`,
    title: `${seo.short} дитячі 6–16 купити в Україні`,
    description: `Дитячі ${seo.short.toLowerCase()} 6–16 років. Доставка Новою Поштою, оплата карткою онлайн. LUMI.`,
    intro: seo.allIntro,
    productTypeSlug: typeSlug,
    faq: DEFAULT_FAQ,
    related: [
      { href: `/category/girls/${seo.slug}`, label: `${seo.short} для дівчаток` },
      { href: `/category/boys/${seo.slug}`, label: `${seo.short} для хлопчиків` },
      { href: "/size-guide", label: "Таблиця розмірів" },
    ],
  };
}

function buildLandings(): SeoLanding[] {
  const out: SeoLanding[] = [];

  for (const parent of ["girls", "boys"] as const) {
    for (const typeSlug of CLOTHING_TYPES) {
      const landing = typeLanding(parent, typeSlug);
      if (landing) out.push(landing);
    }
    for (const typeSlug of GENDER_ACCESSORIES) {
      const landing = typeLanding(parent, typeSlug);
      if (landing) out.push(landing);
    }
    for (const band of AGE_BANDS) out.push(ageLanding(parent, band));

    out.push(
      intentLanding(parent, {
        slug: "shkilnyy-odyag",
        nameCore: "Шкільний одяг",
        h1: "Шкільний одяг для {ua} 6–16 років",
        intro:
          "Одяг до школи для {ua}: футболки, штани, спортивні костюми та взуття. Зручна посадка за ростом, замовлення на сайті з доставкою Новою Поштою.",
        types: SCHOOL_TYPES,
      }),
      intentLanding(parent, {
        slug: "zymovyy-odyag",
        nameCore: "Зимовий одяг",
        h1: "Зимовий одяг для {ua}",
        intro:
          "Зимові куртки, парки та шапки для {ua} 6–16 років. Обирайте за ростом — доставка по Україні.",
        types: WINTER_TYPES,
      }),
      intentLanding(parent, {
        slug: "litniy-odyag",
        nameCore: "Літній одяг",
        h1: "Літній одяг для {ua} 6–16 років",
        intro:
          "Літні футболки, штани та кепки для {ua}. Легкі речі на кожен день, замовлення на lumi.kids.",
        types: SUMMER_TYPES,
      }),
      intentLanding(parent, {
        slug: "pidlitkovyy-odyag",
        nameCore: "Підлітковий одяг",
        h1: "Підлітковий одяг для {ua} 13–16 років",
        intro:
          "Одяг для підлітків {ua} 13–16 років. Рости від 158 см. Стиль ближчий до дорослого, розміри — за таблицею LUMI.",
        types: CLOTHING_TYPES,
        sizes: AGE_BANDS[2].sizes,
      })
    );
  }

  for (const slug of ACCESSORY_TYPE_SLUGS) out.push(accessoryLanding(slug));

  out.push(
    rootTypeLanding("outerwear"),
    rootTypeLanding("sportswear"),
    rootTypeLanding("tshirts"),
    rootTypeLanding("sets"),
    {
      parent: "root",
      slug: "shkilnyy-odyag",
      path: "/category/shkilnyy-odyag",
      name: "Шкільний одяг",
      h1: "Шкільний одяг для дітей 6–16 років",
      title: "Шкільний одяг дитячий купити в Україні",
      description:
        "Одяг до школи для дівчаток і хлопчиків 6–16 років. Доставка Новою Поштою. Інтернет-магазин LUMI.",
      intro:
        "Підбірка в школу: футболки, штани, спортивні костюми, сукні та взуття. Обирайте за ростом і статтю — замовлення лише на сайті.",
      productTypeSlugs: [...SCHOOL_TYPES],
      faq: DEFAULT_FAQ,
      related: [
        { href: "/category/girls/shkilnyy-odyag", label: "Шкільний одяг для дівчаток" },
        { href: "/category/boys/shkilnyy-odyag", label: "Шкільний одяг для хлопчиків" },
        { href: "/size-guide", label: "Таблиця розмірів" },
      ],
    },
    {
      parent: "root",
      slug: "zymovyy-odyag",
      path: "/category/zymovyy-odyag",
      name: "Зимовий одяг",
      h1: "Зимовий одяг для дітей 6–16 років",
      title: "Зимовий одяг дитячий купити в Україні",
      description: "Зимові куртки, парки та шапки для дітей 6–16 років. Доставка Новою Поштою. LUMI.",
      intro:
        "Верхній одяг і шапки на зиму. Підбір за ростом, доставка Новою Поштою по Україні, оплата карткою онлайн.",
      productTypeSlugs: [...WINTER_TYPES],
      faq: DEFAULT_FAQ,
      related: [
        { href: "/category/girls/zymovyy-odyag", label: "Зима для дівчаток" },
        { href: "/category/boys/zymovyy-odyag", label: "Зима для хлопчиків" },
        { href: "/category/verkhniy-odyag", label: "Весь верхній одяг" },
      ],
    },
    {
      parent: "root",
      slug: "pidlitkovyy-odyag",
      path: "/category/pidlitkovyy-odyag",
      name: "Підлітковий одяг",
      h1: "Підлітковий одяг 13–16 років",
      title: "Підлітковий одяг 13–16 купити в Україні",
      description:
        "Одяг для підлітків 13–16 років (дівчатка і хлопчики). Доставка Новою Поштою. LUMI.",
      intro:
        "Колекція для підлітків: рости від 158 см. Зручні силуети, які можна носити в школу і після уроків.",
      sizes: AGE_BANDS[2].sizes,
      faq: DEFAULT_FAQ,
      related: [
        { href: "/category/girls/13-16-rokiv", label: "Дівчатка 13–16" },
        { href: "/category/boys/13-16-rokiv", label: "Хлопчики 13–16" },
        { href: "/size-guide", label: "Таблиця розмірів" },
      ],
    }
  );

  return out;
}

export const SEO_LANDINGS: readonly SeoLanding[] = buildLandings();

const byPath = new Map(SEO_LANDINGS.map((l) => [l.path, l]));

export function getLandingByPath(path: string): SeoLanding | undefined {
  return byPath.get(path);
}

export function getRootLanding(slug: string): SeoLanding | undefined {
  return SEO_LANDINGS.find((l) => l.parent === "root" && l.slug === slug);
}

export function getClusterLanding(
  parent: string,
  cluster: string
): SeoLanding | undefined {
  if (parent !== "girls" && parent !== "boys" && parent !== "accessories") return undefined;
  return SEO_LANDINGS.find((l) => l.parent === parent && l.slug === cluster);
}

export function listClusterParams(): { slug: string; cluster: string }[] {
  return SEO_LANDINGS.filter((l) => l.parent !== "root").map((l) => ({
    slug: l.parent,
    cluster: l.slug,
  }));
}

export function listRootLandingSlugs(): string[] {
  return SEO_LANDINGS.filter((l) => l.parent === "root").map((l) => l.slug);
}

export { PRODUCT_TYPE_TO_CLUSTER, typeClusterPath } from "@/lib/seo-landing-paths";

export const TYPE_QUERY_REDIRECTS: {
  parent: "girls" | "boys" | "accessories";
  type: string;
  cluster: string;
}[] = [
  ...(["girls", "boys"] as const).flatMap((parent) =>
    [...CLOTHING_TYPES, ...GENDER_ACCESSORIES]
      .filter((type) => typeAllowedFor(parent, type))
      .map((type) => ({ parent, type, cluster: PRODUCT_TYPE_TO_CLUSTER[type] }))
  ),
  ...ACCESSORY_TYPE_SLUGS.map((type) => ({
    parent: "accessories" as const,
    type,
    cluster: PRODUCT_TYPE_TO_CLUSTER[type],
  })),
];
