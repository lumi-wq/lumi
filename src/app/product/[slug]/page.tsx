import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailPage } from "@/components/product/ProductDetailPage";
import { canonicalMetadata } from "@/lib/seo";
import { isTestPaymentSlug, TEST_PAYMENT_SLUG } from "@/lib/test-payment";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    where: { slug: { not: TEST_PAYMENT_SLUG } },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  if (isTestPaymentSlug(params.slug)) return {};
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { productType: true },
  });
  if (!product) return {};
  const who = product.gender === "GIRL" ? "дівчаток" : "хлопчиків";
  const typeName = product.productType?.name;
  const description = `${product.description} Купити онлайн з доставкою Новою Поштою по Україні.`.slice(
    0,
    320
  );
  const path = `/product/${product.slug}`;
  return {
    title: `${product.name} для ${who}`,
    description,
    ...canonicalMetadata(path),
    openGraph: {
      ...canonicalMetadata(path).openGraph,
      title: `${product.name}${typeName ? ` — ${typeName}` : ""} | LUMI`,
      description,
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  if (isTestPaymentSlug(params.slug)) notFound();
  return <ProductDetailPage slug={params.slug} />;
}
