import { SupabaseClient, User } from "@supabase/supabase-js";

export const uploadAvatar = async (
  e: React.ChangeEvent<HTMLInputElement>,
  supabase: SupabaseClient,
  user: User,
  setError: (error: string | null) => void,
  setUploading: (uploading: boolean) => void,
  setAvatarUrl: (url: string) => void
) => {
  try {
    setError(null);
    setUploading(true);

    if (!e.target.files || e.target.files.length === 0) {
      throw new Error("Please select an image file");
    }

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    console.log("Starting avatar upload for user:", user.id);
    console.log("File path in avatars bucket:", filePath);

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    console.log("Upload successful, retrieving public URL...");
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;
    console.log("Public URL retrieved:", publicUrl);

    console.log("Updating users table with avatar_url:", publicUrl);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    console.log("User profile updated successfully with new avatar URL");
    setAvatarUrl(publicUrl);
  } catch (error: any) {
    console.error("Error uploading avatar:", error);
    setError(error.message || "Failed to upload avatar");
  } finally {
    setUploading(false);
    console.log("Upload process completed");
  }
};