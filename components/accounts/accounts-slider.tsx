"use client";
import { useAccountsStore } from "@/lib/store/accounts";
import { AccountCard } from "./account-card";

/**
 * Carrusel de cuentas en celular. El anclaje es obligatorio y por tarjeta:
 * el dedo puede ir rápido y saltar varias, pero el scroll siempre termina
 * cuadrado en una — nunca a mitad de camino entre dos. Un empujón corto
 * avanza de a una, y si se suelta a medias vuelve a la más cercana.
 */
export function AccountsSlider() {
  const accounts = useAccountsStore((s) => s.activeAccounts);

  if (accounts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Crea tu primera cuenta para empezar.
      </div>
    );
  }
  return (
    <div className="relative w-screen left-1/2 -translate-x-1/2">
      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-3 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollBehavior: "smooth" }}
      >
        {accounts.map((a) => (
          <div key={a.id} className="snap-start shrink-0">
            <AccountCard account={a} />
          </div>
        ))}
      </div>
    </div>
  );
}
