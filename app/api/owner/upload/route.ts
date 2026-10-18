import { NextResponse } from "next/server";
import { requireOwnerApi, apiError } from "@/lib/auth/owner-api";

// ============================================================================
// POST /api/owner/upload
// ============================================================================
// Uploads a product image to Supabase Storage and returns its public URL.
// Owner-only. Validates type + size before touching storage.
// ============================================================================

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const BUCKET = "product-images";

export async function POST(request: Request) {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("Expected a multipart form upload.", "bad_request");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return apiError("No file provided.", "bad_request");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return apiError(
      "Unsupported image type. Use JPEG, PNG, WebP, or AVIF.",
      "invalid_type"
    );
  }

  if (file.size > MAX_BYTES) {
    return apiError("Image is larger than 5 MB. Please upload a smaller file.", "too_large");
  }

  try {
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext || "jpg"}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await auth.admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      // Friendly hint when the bucket has not been created yet.
      if (/bucket/i.test(uploadError.message)) {
        return apiError(
          `Storage bucket “${BUCKET}” is missing. Create it in Supabase → Storage (public), then retry. See docs/SETUP.md.`,
          "bucket_missing",
          500
        );
      }
      return apiError(uploadError.message, "upload_failed", 500);
    }

    const { data: pub } = auth.admin.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ ok: true, url: pub.publicUrl });
  } catch (err) {
    console.error("[owner/upload] error:", err);
    return apiError("Could not upload the image.", "server_error", 500);
  }
}
