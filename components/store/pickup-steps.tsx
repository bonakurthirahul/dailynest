// Expanded "how pickup works" explainer for the store info page.
export function PickupSteps() {
  const steps = [
    {
      title: "Order online",
      body: "Browse the catalogue, add items, and check out. Your order is reserved against live stock the moment you place it.",
    },
    {
      title: "Get an order number",
      body: "You receive a unique order number like DN-1042. The store owner is notified instantly and accepts your order.",
    },
    {
      title: "Wait for “ready for pickup”",
      body: "Watch the live status move from Pending to Accepted, Preparing, and finally Ready for Pickup.",
    },
    {
      title: "Collect & pay at the counter",
      body: "Show your order number at the DailyNest counter and pay by cash or UPI. There is no online payment and no delivery fee.",
    },
  ];

  return (
    <section className="mt-14">
      <h2 className="text-2xl font-extrabold tracking-tight text-charcoal">
        Pickup, step by step
      </h2>
      <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, idx) => (
          <li key={step.title} className="card relative p-6">
            <span
              className="absolute right-5 top-5 text-4xl font-extrabold text-fresh/20"
              aria-hidden="true"
            >
              {idx + 1}
            </span>
            <h3 className="pr-10 font-bold text-charcoal">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-8 rounded-2xl border border-fresh/30 bg-fresh/8 px-5 py-4 text-sm font-medium text-forest">
        No home delivery · No online payment · No delivery fee — just order
        ahead and collect in store.
      </p>
    </section>
  );
}
