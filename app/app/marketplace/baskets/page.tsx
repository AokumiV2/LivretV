import { BasketCard } from "@/components/cards/basket-card";
import { baskets } from "@/lib/mock/baskets";

export default function BasketsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Baskets</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {baskets.map((basket) => <BasketCard key={basket.id} basket={basket} />)}
      </div>
    </div>
  );
}
