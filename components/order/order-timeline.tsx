import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

// Vertical status timeline for a customer's order. Only renders steps up to
// the current status; terminal states (rejected/cancelled) show a banner.
export function OrderTimeline({ status }: { status: OrderStatus }) {
  const isTerminalBad = status === "rejected" || status === "cancelled";
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  if (isTerminalBad) {
    return (
      <div
        role="status"
        className={`rounded-2xl border p-5 ${
          status === "rejected"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-line bg-ivory-dark text-charcoal-soft"
        }`}
      >
        <p className="font-bold">
          {status === "rejected" ? "Order rejected" : "Order cancelled"}
        </p>
        <p className="mt-1 text-sm">
          {status === "rejected"
            ? "The store could not fulfil this order. Any payment discussion happens at the counter — nothing was charged online."
            : "This order was cancelled. No online payment was taken."}
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {ORDER_STATUS_FLOW.map((step, idx) => {
        const done = idx < currentIndex;
        const current = idx === currentIndex;
        return (
          <li key={step} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Connector */}
            {idx < ORDER_STATUS_FLOW.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5 ${
                  done ? "bg-fresh" : "bg-line"
                }`}
              />
            )}

            <span
              aria-hidden="true"
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                done
                  ? "border-fresh bg-fresh text-white"
                  : current
                    ? "border-forest bg-white text-forest"
                    : "border-line bg-white text-muted"
              }`}
            >
              {done ? (
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : current ? (
                <span className="h-2.5 w-2.5 animate-pulse-dot rounded-full bg-forest" />
              ) : (
                idx + 1
              )}
            </span>

            <div className="pt-1">
              <p
                className={`text-sm font-bold ${
                  current ? "text-forest" : done ? "text-charcoal" : "text-muted"
                }`}
              >
                {ORDER_STATUS_LABEL[step]}
              </p>
              {current && (
                <p className="mt-0.5 text-xs text-muted">
                  {step === "pending" && "Waiting for the store to accept your order."}
                  {step === "accepted" && "The store has accepted your order."}
                  {step === "preparing" && "Your groceries are being packed."}
                  {step === "ready" && "Head to the counter — your order is ready!"}
                  {step === "collected" && "You have collected your order. Thank you!"}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
