"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Dictionary } from "@/lib/dictionaries/types";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { staggerChild, staggerParent } from "@/lib/motion";

export function LeadForm({
  dict,
  className,
}: {
  dict: Dictionary;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const service = String(data.get("service") ?? "");
    const message = String(data.get("message") ?? "").trim();

    setErrorMessage(null);
    setSuccess(false);

    if (!name || !email) {
      setErrorMessage(dict.form.error);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, service, message }),
      });

      const payload = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;

      if (!res.ok || !payload?.ok) {
        setErrorMessage(payload?.error || dict.form.error);
        return;
      }

      setSuccess(true);
      form.reset();
    } catch {
      setErrorMessage(dict.form.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className={cn(
        "w-full max-w-lg rounded-xl border border-white/10 bg-[#161618] p-8 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.75)] md:p-10",
        className
      )}
      variants={staggerParent}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <motion.h2
        variants={staggerChild}
        id="lead-form-heading"
        className="text-xl font-semibold tracking-tight text-foreground md:text-2xl"
      >
        {dict.form.title}
      </motion.h2>
      <motion.p
        variants={staggerChild}
        className="mt-2 text-sm leading-relaxed text-white/50"
      >
        {dict.form.trustNote}
      </motion.p>
      <motion.form
        variants={staggerChild}
        className="mt-8 space-y-5"
        onSubmit={handleSubmit}
      >
        <div>
          <label htmlFor="lead-name" className="text-xs text-white/50">
            {dict.form.name}
          </label>
          <input
            id="lead-name"
            name="name"
            required
            autoComplete="name"
            className="input mt-1.5 text-sm text-foreground placeholder:text-white/35 focus:border-accent/50"
          />
        </div>
        <div>
          <label htmlFor="lead-email" className="text-xs text-white/50">
            {dict.form.email}
          </label>
          <input
            id="lead-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input mt-1.5 text-sm text-foreground placeholder:text-white/35 focus:border-accent/50"
          />
        </div>
        <div>
          <label htmlFor="lead-service" className="text-xs text-white/50">
            {dict.form.service}
          </label>
          <select
            id="lead-service"
            name="service"
            className="input mt-1.5 text-sm text-foreground"
            defaultValue=""
          >
            <option value="" disabled>
              —
            </option>
            {dict.form.serviceOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lead-message" className="text-xs text-white/50">
            {dict.form.message}
          </label>
          <textarea
            id="lead-message"
            name="message"
            rows={4}
            className="input mt-1.5 resize-y text-sm text-foreground placeholder:text-white/35 focus:border-accent/50"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          className="min-h-14 w-full text-base"
          disabled={loading}
        >
          {loading ? dict.form.sending : dict.form.submit}
        </Button>
      </motion.form>
      {success ? (
        <p className="mt-4 text-sm text-accent" role="status">
          {dict.form.success}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-4 text-sm text-red-400/90" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </motion.div>
  );
}
