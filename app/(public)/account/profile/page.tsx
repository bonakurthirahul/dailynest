import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/account/profile-form";

export const dynamic = "force-dynamic";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-extrabold text-charcoal">Your profile</h2>
      <p className="mt-1 text-sm text-muted">
        Keep your contact details current so the store can reach you about
        orders.
      </p>

      <div className="mt-6">
        <ProfileForm
          email={user?.email ?? ""}
          fullName={(profile?.full_name as string | null) ?? ""}
          phone={(profile?.phone as string | null) ?? ""}
        />
      </div>
    </div>
  );
}
