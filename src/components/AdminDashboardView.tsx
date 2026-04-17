"use client";

import { SEED_PRODUCT_IDS } from "@/data/products";
import type { Store } from "@/data/stores";
import { SEED_STORE_IDS } from "@/data/stores";
import { motion } from "framer-motion";
import { useReducedMotionHydrationSafe } from "@/hooks/use-reduced-motion-hydration-safe";
import { BarChart3, Package, Store as StoreIcon } from "lucide-react";
import { useCatalog } from "@/providers/catalog-provider";
import { useMemo, useState } from "react";

const FAKE_ORDERS = 1284;
const FAKE_REVENUE = 48290;

type Tab = "product" | "store";

export function AdminDashboardView() {
  const reduce = useReducedMotionHydrationSafe();
  const {
    products,
    stores,
    addProduct,
    addStore,
    extraProductCount,
    extraStoreCount,
  } = useCatalog();
  const [tab, setTab] = useState<Tab>("product");
  const [notice, setNotice] = useState<string | null>(null);

  const userProducts = useMemo(
    () => products.filter((p) => !SEED_PRODUCT_IDS.has(p.id)),
    [products],
  );
  const userStores = useMemo(
    () => stores.filter((s) => !SEED_STORE_IDS.has(s.id)),
    [stores],
  );

  return (
    <div className="px-5 pb-28 pt-[3.25rem]">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduce ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 32 }
        }
        className="mb-6"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Console
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">Admin</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">
          Demo CMS — changes persist in this browser via local storage.
        </p>
      </motion.header>

      {/* Fake analytics */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.04, type: "spring", stiffness: 320, damping: 30 }}
          className="rounded-2xl bg-white p-4 [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]"
        >
          <div className="flex items-center gap-2 text-zinc-500">
            <BarChart3 className="h-4 w-4" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Orders</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
            {FAKE_ORDERS.toLocaleString("en-US")}
          </p>
          <p className="mt-1 text-[10px] text-zinc-400">Last 30 days · simulated</p>
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.08, type: "spring", stiffness: 320, damping: 30 }}
          className="rounded-2xl bg-white p-4 [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]"
        >
          <div className="flex items-center gap-2 text-zinc-500">
            <BarChart3 className="h-4 w-4" aria-hidden />
            <span className="text-[10px] font-semibold uppercase tracking-wide">Revenue</span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(FAKE_REVENUE)}
          </p>
          <p className="mt-1 text-[10px] text-zinc-400">Demo benchmark · not live data</p>
        </motion.div>
      </div>

      <p className="mb-4 text-center text-[11px] text-zinc-500">
        Session uploads:{" "}
        <span className="font-semibold text-zinc-800">{extraProductCount}</span> products ·{" "}
        <span className="font-semibold text-zinc-800">{extraStoreCount}</span> stores
      </p>

      <div className="mb-5 flex rounded-2xl bg-zinc-100 p-1">
        {(
          [
            { id: "product" as const, label: "Add product", Icon: Package },
            { id: "store" as const, label: "Add store", Icon: StoreIcon },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-semibold transition ${tab === t.id ? "text-zinc-900" : "text-zinc-500"}`}
          >
            {tab === t.id ? (
              <motion.span
                layoutId="admin-tab"
                className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-black/5"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            ) : null}
            <t.Icon className="relative z-10 h-3.5 w-3.5" />
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>

      {notice ? (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl bg-emerald-50 px-3 py-2 text-center text-[11px] font-medium text-emerald-900 ring-1 ring-emerald-200/80"
        >
          {notice}
        </motion.p>
      ) : null}

      {tab === "product" ? (
        <ProductForm
          stores={stores}
          onSave={() => {
            setNotice("Product saved to this device.");
            window.setTimeout(() => setNotice(null), 2200);
          }}
          addProduct={addProduct}
        />
      ) : (
        <StoreForm
          onSave={() => {
            setNotice("Store saved to this device.");
            window.setTimeout(() => setNotice(null), 2200);
          }}
          addStore={addStore}
        />
      )}

      <section className="mt-8 space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Your uploads
        </h2>
        {userStores.length === 0 && userProducts.length === 0 ? (
          <p className="rounded-xl bg-zinc-50 px-3 py-3 text-[12px] text-zinc-500 ring-1 ring-zinc-900/5">
            Nothing yet — add a store or product above.
          </p>
        ) : null}
        <ul className="space-y-2">
          {userStores.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px] ring-1 ring-zinc-900/5"
            >
              <StoreIcon className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-semibold text-zinc-900">{s.name}</span>
              <span className="text-zinc-400">· store</span>
            </li>
          ))}
          {userProducts.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px] ring-1 ring-zinc-900/5"
            >
              <Package className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-semibold text-zinc-900">{p.name}</span>
              <span className="text-zinc-400">· product</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ProductForm({
  stores,
  onSave,
  addProduct,
}: {
  stores: Store[];
  onSave: () => void;
  addProduct: ReturnType<typeof useCatalog>["addProduct"];
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("99");
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [category, setCategory] = useState("General");
  const [image, setImage] = useState("");
  const [isRecommended, setIsRecommended] = useState(true);
  const [isTrending, setIsTrending] = useState(false);
  const [isBestSeller, setIsBestSeller] = useState(false);

  return (
    <form
      className="space-y-3 rounded-2xl bg-white p-4 [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = Number(price);
        if (!name.trim() || !storeId || Number.isNaN(parsed)) return;
        addProduct({
          name: name.trim(),
          price: parsed,
          storeId,
          category: category.trim() || "General",
          isRecommended,
          isTrending,
          isBestSeller,
          image: image.trim() || undefined,
        });
        setName("");
        setImage("");
        onSave();
      }}
    >
      <Field label="Name">
        <input
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Merino crewneck"
        />
      </Field>
      <Field label="Price (USD)">
        <input
          required
          inputMode="decimal"
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </Field>
      <Field label="Store">
        <select
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Category">
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </Field>
      <Field label="Image URL (optional)">
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://images.unsplash.com/…"
        />
      </Field>
      <div className="flex flex-col gap-2 text-[12px] font-medium text-zinc-700">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isRecommended}
            onChange={(e) => setIsRecommended(e.target.checked)}
          />
          AI pick (isRecommended)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isTrending}
            onChange={(e) => setIsTrending(e.target.checked)}
          />
          Trending
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isBestSeller}
            onChange={(e) => setIsBestSeller(e.target.checked)}
          />
          Best seller
        </label>
      </div>
      <button
        type="submit"
        className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800 active:scale-[0.99]"
      >
        Save product
      </button>
    </form>
  );
}

function StoreForm({
  onSave,
  addStore,
}: {
  onSave: () => void;
  addStore: ReturnType<typeof useCatalog>["addStore"];
}) {
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [rating, setRating] = useState("4.8");
  const [reviewCount, setReviewCount] = useState("1200");
  const [logo, setLogo] = useState("");

  return (
    <form
      className="space-y-3 rounded-2xl bg-white p-4 [box-shadow:var(--shadow-card)] ring-1 ring-zinc-900/[0.04]"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        addStore({
          name: name.trim(),
          tagline: tagline.trim() || "New on Helia",
          rating: Math.min(5, Math.max(0, Number(rating) || 0)),
          reviewCount: Math.max(0, Number(reviewCount) || 0),
          logo: logo.trim() || undefined,
        });
        setName("");
        setTagline("");
        onSave();
      }}
    >
      <Field label="Store name">
        <input
          required
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Northwind Supply"
        />
      </Field>
      <Field label="Tagline">
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Rating">
          <input
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          />
        </Field>
        <Field label="Reviews">
          <input
            inputMode="numeric"
            className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
            value={reviewCount}
            onChange={(e) => setReviewCount(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Logo URL (optional)">
        <input
          className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none ring-zinc-900/10 focus:ring-4"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          placeholder="https://images.unsplash.com/…"
        />
      </Field>
      <button
        type="submit"
        className="w-full rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-zinc-800 active:scale-[0.99]"
      >
        Save store
      </button>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}
