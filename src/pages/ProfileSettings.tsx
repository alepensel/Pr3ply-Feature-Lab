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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador","Egypt",
  "El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France","Gabon",
  "Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau","Guyana",
  "Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel",
  "Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait","Kyrgyzstan","Laos",
  "Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg","Madagascar","Malawi",
  "Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico","Micronesia","Moldova",
  "Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru","Nepal","Netherlands",
  "New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palau",
  "Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania",
  "Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino",
  "Sao Tome and Principe","Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia",
  "Solomon Islands","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden",
  "Switzerland","Syria","Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago",
  "Tunisia","Turkey","Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States",
  "Uruguay","Uzbekistan","Vanuatu","Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

const ENGLISH_LEVELS = [
  { value: "A1", label: "A1 — Beginner" },
  { value: "A2", label: "A2 — Elementary" },
  { value: "B1", label: "B1 — Intermediate" },
  { value: "B2", label: "B2 — Upper Intermediate" },
  { value: "C1", label: "C1 — Advanced" },
  { value: "C2", label: "C2 — Proficient" },
];

const ABOUT_ME_MAX = 350;

const ProfileSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, refetch } = useProfile();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [englishLevel, setEnglishLevel] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setAvatarUrl(profile.avatar_url);
      setCountry(profile.country || "");
      setEnglishLevel(profile.english_level || "");
      setAboutMe(profile.about_me || "");
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
        country: country || null,
        english_level: englishLevel || null,
        about_me: aboutMe || null,
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

          {/* Country */}
          <div>
            <Label className="text-sm font-medium">I was born in</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {COUNTRIES.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* English Level */}
          <div>
            <Label className="text-sm font-medium">English Level</Label>
            <Select value={englishLevel} onValueChange={setEnglishLevel}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent>
                {ENGLISH_LEVELS.map(l => (
                  <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* About me */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label htmlFor="aboutMe" className="text-sm font-medium">About me</Label>
              <span className={`text-xs ${aboutMe.length > ABOUT_ME_MAX ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                {aboutMe.length}/{ABOUT_ME_MAX}
              </span>
            </div>
            <Textarea
              id="aboutMe"
              value={aboutMe}
              onChange={e => { if (e.target.value.length <= ABOUT_ME_MAX) setAboutMe(e.target.value); }}
              placeholder="Tell others a bit about yourself…"
              className="resize-none"
              rows={4}
            />
          </div>

          <Button onClick={handleSave} disabled={saving || !firstName.trim() || aboutMe.length > ABOUT_ME_MAX} className="w-full bg-preply-pink text-foreground hover:bg-preply-pink/90 font-semibold rounded-full py-6 text-base">
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
