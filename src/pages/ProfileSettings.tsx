import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ProfileSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, refetch } = useProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  if (!user) { navigate("/auth"); return null; }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum size is 2MB", variant: "destructive" });
      return;
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast({ title: "Invalid format", description: "Only JPG or PNG allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const displayName = [firstName, lastName].filter(Boolean).join(" ") || null;
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName || null,
        last_name: lastName || null,
        display_name: displayName,
        avatar_url: avatarUrl,
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile saved!" });
      refetch();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </main>
      </div>
    );
  }

  const initials = [firstName, lastName].map(n => n?.[0] || "").join("").toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container py-8 md:py-16 max-w-xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-8">Account Settings</h1>

        <div className="space-y-8">
          {/* Avatar */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-3 block">Profile image</Label>
            <div className="flex items-start gap-6">
              <div className="relative group">
                <Avatar className="h-28 w-28 border-4 border-border">
                  <AvatarImage src={avatarUrl || undefined} alt="Profile" />
                  <AvatarFallback className="text-2xl font-bold bg-secondary text-muted-foreground">{initials}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-foreground/0 group-hover:bg-foreground/30 transition-colors flex items-center justify-center"
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-6 w-6 text-background animate-spin" />
                  ) : (
                    <Camera className="h-6 w-6 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="gap-2">
                  <Camera className="h-4 w-4" />
                  Upload photo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Maximum size — 2MB<br />JPG or PNG format</p>
              </div>
            </div>
          </div>

          {/* Name fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="text-sm font-medium">First name <span className="text-muted-foreground">• Required</span></Label>
              <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Your first name" className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm font-medium">Last name</Label>
              <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Your last name" className="mt-1.5" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving || !firstName.trim()} className="w-full bg-preply-pink text-foreground hover:bg-preply-pink/90 font-semibold rounded-full py-6 text-base">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save changes
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileSettings;
