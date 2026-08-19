import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const u = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

// Пул фотографій одягу/дітей з Unsplash
const POOL = [
  "photo-1556821840-3a63f95609a7",
  "photo-1620799140408-edc6dcb6d633",
  "photo-1521572163474-6864f9cf17ab",
  "photo-1523381210434-271e8be1f52b",
  "photo-1562157873-818bc0726f68",
  "photo-1618354691373-d851c5c3a990",
  "photo-1591047139829-d91aecb6caea",
  "photo-1548126032-079a0fb0099d",
  "photo-1544966503-7cc5ac882d5f",
  "photo-1578681994506-b8f463449011",
  "photo-1602810318383-e386cc2a3ccf",
  "photo-1503342217505-b0a15ec3261c",
  "photo-1489987707025-afc232f7bdaf",
  "photo-1441984904996-e0b6ba687e04",
  "photo-1445205170230-053b83016050",
  "photo-1434389677669-e08b4cac3105",
  "photo-1516762689617-e1cffcef479d",
  "photo-1576871337622-98d48d1cf531",
  "photo-1522771930-78848d9293e8",
  "photo-1503919545889-aef636e10ad4",
  "photo-1519689680058-324335c77eba",
  "photo-1503454537195-1dcabb73ffb9",
  "photo-1471286174890-9c112ffca5b4",
  "photo-1476234251651-f353703a034d",
];

const imagesFor = (i: number) => [
  u(POOL[i % POOL.length]),
  u(POOL[(i + 1) % POOL.length]),
  u(POOL[(i + 2) % POOL.length]),
  u(POOL[(i + 3) % POOL.length]),
];

const SIZES_HEIGHT = ["116 см", "122 см", "128 см", "134 см", "140 см", "146 см", "152 см", "158 см", "164 см", "170 см", "176 см"];

const COLORS: Record<string, string> = {
  "Яскраво-синій": "#3B5BFF",
  Кремовий: "#F1E8DC",
  Зелений: "#3F6B4F",
  Пісочний: "#D6C6A8",
  Індиго: "#27346E",
  Синій: "#3B5BFF",
  Лавандовий: "#C8BFE7",
  Графітовий: "#4A4A4A",
};

type SeedProduct = {
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  tag?: string;
  tagStyle?: "cobalt" | "dark";
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isSale?: boolean;
  gender?: "BOY" | "GIRL";
  typeSlug?: string;
  colors: string[];
  description: string;
};

const MATERIALS =
  "100% натуральна бавовна. Пофарбовано рослинними фарбами — безпечно для дитячої шкіри та довкілля.";

const TEENS: SeedProduct[] = [
  {
    slug: "hudi-kanso",
    name: "Худі Kanso",
    price: 1250,
    tag: "Хіт",
    rating: 4.9,
    reviewCount: 48,
    isFeatured: true,
    colors: ["Яскраво-синій", "Кремовий", "Пісочний", "Індиго"],
    description:
      "М'яке оверсайз-худі з щільної бавовни з начосом. Ідеальне для школи, прогулянок та спорту. Не втрачає форму після прання.",
  },
  {
    slug: "futbolka-lumi",
    name: "Футболка Lumi",
    price: 690,
    tag: "Новий колір",
    rating: 4.8,
    reviewCount: 36,
    isFeatured: true,
    colors: ["Кремовий", "Яскраво-синій", "Зелений"],
    description:
      "Базова футболка вільного крою з органічної бавовни. Дихаюча тканина, посилені шви, жодних принтів, що тріскаються.",
  },
  {
    slug: "svetr-na-blyskavtsi",
    name: "Светр на блискавці",
    price: 1850,
    tag: "Лімітована",
    tagStyle: "dark",
    rating: 4.7,
    reviewCount: 21,
    isFeatured: true,
    colors: ["Зелений", "Графітовий", "Кремовий"],
    description:
      "Теплий светр із високим коміром та блискавкою. В'язка середньої щільності, комфортний навіть на голе тіло.",
  },
  {
    slug: "shtany-vilnoho-kroyu",
    name: "Штани вільного крою",
    price: 1400,
    tag: "Еко",
    rating: 4.8,
    reviewCount: 29,
    isFeatured: true,
    colors: ["Лавандовий", "Пісочний", "Графітовий"],
    description:
      "Штани вільного крою з м'якого трикотажу. Еластичний пояс, глибокі кишені — максимальна свобода рухів.",
  },
  {
    slug: "vitrivka-active-shell",
    name: "Вітрівка Active Shell",
    price: 1760,
    compareAtPrice: 2200,
    tag: "Водостійка",
    tagStyle: "dark",
    rating: 4.9,
    reviewCount: 17,
    isFeatured: true,
    colors: ["Яскраво-синій", "Зелений"],
    description:
      "Легка вітрівка з водовідштовхувальним покриттям. Капюшон, вентиляційні отвори, світловідбивні деталі.",
  },
  {
    slug: "holf-u-rubchyk",
    name: "Гольф у рубчик",
    price: 490,
    compareAtPrice: 850,
    tag: "М'який",
    rating: 4.6,
    reviewCount: 24,
    isFeatured: true,
    isSale: true,
    colors: ["Кремовий", "Пісочний", "Індиго"],
    description:
      "Гольф у дрібний рубчик, який приємно прилягає до тіла. Чудова база під сорочку, худі чи піджак.",
  },
  {
    slug: "parka-shell",
    name: "Парка Shell",
    price: 2900,
    tag: "Хай-тек",
    tagStyle: "dark",
    rating: 4.8,
    reviewCount: 12,
    colors: ["Яскраво-синій", "Графітовий"],
    description:
      "Технологічна парка для міжсезоння: мембрана 5К, проклеєні шви, знімний капюшон.",
  },
  {
    slug: "everyday-rib-mockneck",
    name: "Everyday Rib Mockneck",
    price: 850,
    rating: 4.7,
    reviewCount: 19,
    colors: ["Кремовий", "Пісочний"],
    description:
      "Лонгслів у рубчик зі стійкою. Універсальна річ для школи та вихідних.",
  },
  {
    slug: "hudi-kanso-z-nachosom",
    name: "Худі Kanso з начосом",
    price: 1250,
    tag: "Хіт",
    rating: 4.9,
    reviewCount: 33,
    colors: ["Яскраво-синій", "Зелений"],
    description:
      "Версія легендарного худі Kanso з теплим начосом усередині. Для прохолодних днів.",
  },
  {
    slug: "oversize-hudi-lumi",
    name: "Оверсайз худі Lumi",
    price: 1450,
    rating: 4.8,
    reviewCount: 26,
    colors: ["Пісочний", "Кремовий", "Лавандовий"],
    description:
      "Худі максимального оверсайзу з опущеною лінією плеча. Стиль, який обирають підлітки.",
  },
  {
    slug: "dytiache-hudi-na-blyskavtsi",
    name: "Дитяче худі на блискавці",
    price: 1150,
    tag: "Новинка",
    rating: 4.7,
    reviewCount: 11,
    colors: ["Яскраво-синій", "Зелений", "Кремовий"],
    description:
      "Худі на блискавці, яке легко вдягати та знімати. Капюшон без шнурків — безпечно для дітей.",
  },
  {
    slug: "eko-hudi-z-bavovny",
    name: "Еко-худі з бавовни",
    price: 1100,
    tag: "Еко",
    rating: 4.8,
    reviewCount: 22,
    colors: ["Зелений", "Пісочний"],
    description:
      "Худі з сертифікованої органічної бавовни. Фарбування без важких металів.",
  },
  {
    slug: "flisove-hudi-active",
    name: "Флісове худі Active",
    price: 1350,
    rating: 4.6,
    reviewCount: 15,
    colors: ["Графітовий", "Яскраво-синій"],
    description:
      "Худі з мікрофлісу для активних тренувань та прогулянок. Швидко сохне, зберігає тепло.",
  },
  {
    slug: "ukorochene-hudi-dlia-pidlitkiv",
    name: "Укорочене худі для підлітків",
    price: 1200,
    rating: 4.7,
    reviewCount: 18,
    colors: ["Лавандовий", "Кремовий"],
    description:
      "Трендове укорочене худі вільного крою. Поєднуй з джинсами з високою посадкою.",
  },
  {
    slug: "technical-shell-parka",
    name: "Technical Shell Parka",
    price: 1590,
    compareAtPrice: 2900,
    tag: "Хіт",
    rating: 4.9,
    reviewCount: 14,
    isSale: true,
    colors: ["Графітовий", "Зелений"],
    description:
      "Функціональна парка з вітро- та вологозахистом. Багато кишень, регульований низ.",
  },
  {
    slug: "svitshot-bazovyi",
    name: "Світшот базовий",
    price: 550,
    compareAtPrice: 950,
    rating: 4.5,
    reviewCount: 20,
    isSale: true,
    colors: ["Кремовий", "Яскраво-синій", "Пісочний"],
    description:
      "Класичний світшот прямого крою. Щільний футер, манжети в рубчик.",
  },
];

const KIDS: SeedProduct[] = [
  {
    slug: "dytiacha-zymova-kurtka",
    name: "Дитяча зимова куртка",
    price: 1450,
    compareAtPrice: 2450,
    tag: "Тепла",
    tagStyle: "dark",
    rating: 4.9,
    reviewCount: 31,
    isSale: true,
    colors: ["Синій", "Зелений"],
    description:
      "Тепла зимова куртка з утеплювачем, капюшоном зі штучним хутром та манжетами-резинками. Витримує до -20°C.",
  },
  {
    slug: "nabir-bazovykh-futbolok",
    name: "Набір базових футболок (3 шт)",
    price: 890,
    tag: "Еко бавовна",
    rating: 4.8,
    reviewCount: 44,
    colors: ["Кремовий", "Синій", "Зелений"],
    description:
      "Три базові футболки з м'якої органічної бавовни. Витримують сотні прань.",
  },
  {
    slug: "velvetovyi-kombinezon",
    name: "Вельветовий комбінезон",
    price: 1550,
    rating: 4.7,
    reviewCount: 16,
    colors: ["Пісочний", "Зелений"],
    description:
      "Комбінезон з м'якого вельвету з регульованими шлейками. Зручні кнопки для швидкого перевдягання.",
  },
  {
    slug: "lehinsy-z-pryntom",
    name: "Легінси з принтом",
    price: 450,
    tag: "Новинка",
    rating: 4.6,
    reviewCount: 27,
    colors: ["Кремовий", "Лавандовий"],
    description:
      "Яскраві легінси з м'яким поясом, що не тисне. Принт не вигорає та не тріскається.",
  },
  {
    slug: "svetr-z-kapiushonom",
    name: "Светр з капюшоном",
    price: 1100,
    rating: 4.7,
    reviewCount: 13,
    colors: ["Зелений", "Кремовий"],
    description:
      "В'язаний светр із капюшоном — теплий, але не колеться. Для садочка та прогулянок.",
  },
  {
    slug: "dzhynsy-vilnoho-kroyu",
    name: "Джинси вільного крою",
    price: 980,
    rating: 4.8,
    reviewCount: 25,
    colors: ["Синій"],
    description:
      "М'які джинси без грубих швів, з еластичним поясом. Не сковують рухи під час гри.",
  },
  {
    slug: "bodi-z-bavovny",
    name: "Боді з бавовни (2 шт)",
    price: 650,
    tag: "Еко",
    rating: 4.9,
    reviewCount: 38,
    colors: ["Кремовий", "Лавандовий"],
    description:
      "Комплект з двох боді з м'якої бавовни інтерлок. Кнопки з нікель-фрі покриттям.",
  },
  {
    slug: "shorty-trykotazhni",
    name: "Шорти трикотажні",
    price: 520,
    rating: 4.5,
    reviewCount: 14,
    colors: ["Синій", "Пісочний", "Зелений"],
    description:
      "Легкі трикотажні шорти для літа. Еластичний пояс зі шнурком.",
  },
  {
    slug: "pizhama-dytiacha",
    name: "Піжама дитяча",
    price: 780,
    tag: "М'яка",
    rating: 4.8,
    reviewCount: 30,
    colors: ["Лавандовий", "Кремовий"],
    description:
      "Затишна піжама з дихаючої бавовни. Плоскі шви — ніщо не заважає солодкому сну.",
  },
  {
    slug: "kurtka-demisezonna",
    name: "Куртка демісезонна",
    price: 1850,
    rating: 4.7,
    reviewCount: 12,
    colors: ["Зелений", "Синій"],
    description:
      "Легка утеплена куртка для весни та осені. Водовідштовхувальна тканина, капюшон.",
  },
];

const REVIEW_TEXTS = [
  { author: "Олена К.", rating: 5, text: "Якість супер! Дитина не знімає, тканина м'яка та приємна." },
  { author: "Андрій М.", rating: 5, text: "Після п'яти прань виглядає як нова. Рекомендую." },
  { author: "Марія В.", rating: 4, text: "Гарна річ, розмір відповідає. Доставка швидка." },
];

async function main() {
  console.log("Очищення бази ...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productType.deleteMany();
  await prisma.category.deleteMany();
  await prisma.otpCode.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.user.deleteMany();

  console.log("Категорії ...");
  const catalog = await prisma.category.create({
    data: {
      slug: "kidswear",
      name: "Одяг 6–16",
      description: "Зручний одяг з натуральних тканин для дітей віком від 6 до 16 років.",
      ageRange: "6-16",
      image: u("photo-1489987707025-afc232f7bdaf"),
    },
  });

  console.log("Типи товарів ...");
  const typeDefs = [
    { slug: "outerwear", name: "Верхній одяг", sortOrder: 10, girlOnly: false, unisex: false },
    { slug: "sportswear", name: "Спортивні костюми", sortOrder: 20, girlOnly: false, unisex: false },
    { slug: "suits", name: "Костюми", sortOrder: 25, girlOnly: false, unisex: false },
    { slug: "tshirts", name: "Футболки", sortOrder: 30, girlOnly: false, unisex: false },
    { slug: "pants", name: "Штани", sortOrder: 40, girlOnly: false, unisex: false },
    { slug: "shorts", name: "Шорти", sortOrder: 45, girlOnly: false, unisex: false },
    { slug: "dresses", name: "Сукні", sortOrder: 50, girlOnly: true, unisex: false },
    { slug: "footwear", name: "Взуття", sortOrder: 60, girlOnly: false, unisex: false },
    { slug: "hats", name: "Шапки", sortOrder: 70, girlOnly: false, unisex: false },
    { slug: "caps", name: "Кепки", sortOrder: 75, girlOnly: false, unisex: false },
    { slug: "bags", name: "Сумки", sortOrder: 80, girlOnly: false, unisex: false },
    { slug: "glasses", name: "Окуляри", sortOrder: 90, girlOnly: false, unisex: true },
  ];
  const typesBySlug = new Map<string, string>();
  for (const t of typeDefs) {
    const row = await prisma.productType.create({ data: t });
    typesBySlug.set(row.slug, row.id);
  }

  console.log("Товари ...");
  const createProducts = async (
    items: SeedProduct[],
    categoryId: string,
    sizes: string[],
    offset: number
  ) => {
    for (let i = 0; i < items.length; i++) {
      const p = items[i];
      const gender = p.gender ?? (i % 2 === 0 ? "BOY" : "GIRL");
      const defaultType =
        gender === "GIRL" && i % 5 === 0
          ? "dresses"
          : (["tshirts", "pants", "outerwear", "sportswear", "footwear", "hats", "caps", "bags", "glasses"] as const)[
              i % 6
            ];
      const typeSlug = p.typeSlug ?? defaultType;
      const images = imagesFor(offset + i);
      const product = await prisma.product.create({
        data: {
          slug: p.slug,
          name: p.name,
          description: p.description,
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? null,
          images,
          tag: p.tag ?? null,
          tagStyle: p.tagStyle ?? "cobalt",
          rating: p.rating,
          reviewCount: p.reviewCount,
          isFeatured: p.isFeatured ?? false,
          featuredAt: p.isFeatured ? new Date() : null,
          isSale: p.isSale ?? false,
          gender,
          materials: MATERIALS,
          categoryId,
          productTypeId: typesBySlug.get(typeSlug) ?? typesBySlug.get("tshirts")!,
          createdAt: new Date(Date.now() - i * 86400000 * 3),
        },
      });

      for (let ci = 0; ci < p.colors.length; ci++) {
        const colorName = p.colors[ci];
        const colorHex = COLORS[colorName] ?? "#CCCCCC";
        const colorRow = await prisma.productColor.create({
          data: {
            productId: product.id,
            name: colorName,
            colorHex,
            images,
            sortOrder: ci,
          },
        });
        await prisma.productVariant.createMany({
          data: sizes.map((size) => ({
            productId: product.id,
            colorId: colorRow.id,
            size,
            color: colorName,
            colorHex,
            stock: 5 + ((offset + i + ci) % 10),
          })),
        });
      }

      await prisma.review.createMany({
        data: REVIEW_TEXTS.map((r) => ({
          productId: product.id,
          authorName: r.author,
          rating: r.rating,
          text: r.text,
        })),
      });
    }
  };

  await createProducts(TEENS, catalog.id, SIZES_HEIGHT, 0);
  await createProducts(KIDS, catalog.id, SIZES_HEIGHT, TEENS.length);

  console.log("Користувачі ...");
  await prisma.user.create({
    data: {
      email: "admin@lumi.ua",
      name: "Адміністратор",
      isAdmin: true,
    },
  });

  const demo = await prisma.user.create({
    data: {
      email: "lumi.customer@example.com",
      name: "Олександр",
      createdAt: new Date("2024-03-15"),
    },
  });

  const hudi = await prisma.product.findUniqueOrThrow({ where: { slug: "hudi-kanso" } });
  const kombinezon = await prisma.product.findUniqueOrThrow({
    where: { slug: "velvetovyi-kombinezon" },
  });
  const lehinsy = await prisma.product.findUniqueOrThrow({ where: { slug: "lehinsy-z-pryntom" } });
  const futbolka = await prisma.product.findUniqueOrThrow({ where: { slug: "futbolka-lumi" } });

  console.log("Демо-замовлення ...");
  await prisma.order.create({
    data: {
      number: "LUMI-78921",
      userId: demo.id,
      email: demo.email,
      firstName: "Олександр",
      lastName: "Шевченко",
      phone: "+380671234567",
      city: "Київ",
      warehouse: "Відділення №12: вул. Хрещатик, 22",
      paymentMethod: "card",
      paymentStatus: "paid",
      status: "DELIVERED",
      subtotal: 3490,
      discount: 0,
      shipping: 0,
      total: 3490,
      promoCode: null,
      createdAt: new Date("2026-03-12"),
      items: {
        create: [
          {
            productId: hudi.id,
            name: hudi.name,
            size: "152 см",
            color: "Яскраво-синій",
            image: hudi.images[0],
            price: 1250,
            quantity: 2,
          },
          {
            productId: futbolka.id,
            name: futbolka.name,
            size: "152 см",
            color: "Кремовий",
            image: futbolka.images[0],
            price: 690,
            quantity: 1,
          },
        ],
      },
    },
  });

  await prisma.order.create({
    data: {
      number: "LUMI-78654",
      userId: demo.id,
      email: demo.email,
      firstName: "Олександр",
      lastName: "Шевченко",
      phone: "+380671234567",
      city: "Київ",
      warehouse: "Відділення №12: вул. Хрещатик, 22",
      paymentMethod: "card",
      paymentStatus: "paid",
      status: "SHIPPED",
      subtotal: 1250,
      discount: 0,
      shipping: 80,
      total: 1250,
      createdAt: new Date("2026-02-28"),
      items: {
        create: [
          {
            productId: hudi.id,
            name: hudi.name,
            size: "164 см",
            color: "Індиго",
            image: hudi.images[0],
            price: 1250,
            quantity: 1,
          },
        ],
      },
    },
  });

  console.log("Обране ...");
  await prisma.wishlistItem.createMany({
    data: [
      { userId: demo.id, productId: kombinezon.id },
      { userId: demo.id, productId: lehinsy.id },
    ],
  });

  const count = await prisma.product.count();
  console.log(`Готово! Товарів: ${count}.`);
  console.log("Адмін: admin@lumi.ua | Демо-клієнт: lumi.customer@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
