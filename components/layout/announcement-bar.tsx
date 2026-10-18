import { getStoreSettings } from "@/lib/data";
import { NO_DELIVERY_NOTICE } from "@/lib/constants";

// Thin announcement strip at the very top of the public site. Kept honest —
// no fake discounts or fabricated urgency.
export async function AnnouncementBar() {
  const settings = await getStoreSettings();
  const closed = settings ? !settings.is_open : false;

  return (
    <div
      className={`text-white ${
        closed ? "bg-charcoal" : "bg-forest"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center text-[0.78rem] font-medium tracking-wide sm:text-[0.82rem]">
        <span aria-hidden="true" className="hidden sm:inline">
          {closed ? "◷" : "◍"}
        </span>
        <span>
          {closed
            ? "The store is currently closed. You can still browse — orders are accepted when we reopen."
            : NO_DELIVERY_NOTICE}
        </span>
      </div>
    </div>
  );
}
