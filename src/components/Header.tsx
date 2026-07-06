import { Link, useNavigate, useLocation } from "react-router-dom";
import BrandMark from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserRole } from "@/hooks/useUserRole";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Bell, Heart, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const Header = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { isTutor } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const dashboardPath = isTutor ? "/tutor-dashboard" : "/dashboard";

  const navItems = user
    ? [
        { label: "Home", path: "/" },
        { label: "My Sessions", path: dashboardPath },
        { label: "Settings", path: "/profile" },
      ]
    : [
        { label: "Browse Sessions", href: "#sessions" },
        { label: "How it Works", href: "#how-it-works" },
        { label: "For Tutors", href: "#tutors" },
      ];

  const initials = profile?.first_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?";

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center h-9 md:h-10">
            <BrandMark className="h-8" />
          </Link>
          <nav className="hidden md:flex items-center gap-5">
            {navItems.map((item) => {
              const isActive = "path" in item && location.pathname === item.path;
              if ("path" in item) {
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    className={cn(
                      "text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              }
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors whitespace-nowrap"
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground" onClick={() => navigate(dashboardPath)}>
                <CalendarCheck className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground">
                <Heart className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-foreground/70 hover:text-foreground">
                <Bell className="h-5 w-5" />
              </Button>
              <button
                onClick={() => navigate("/profile")}
                className="ml-1"
              >
                <Avatar className="h-8 w-8 border-2 border-border">
                  <AvatarImage src={profile?.avatar_url || undefined} alt="Profile" className="object-cover" />
                  <AvatarFallback className="text-xs font-bold bg-secondary text-muted-foreground">{initials}</AvatarFallback>
                </Avatar>
              </button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="text-foreground/70 hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="text-sm font-medium" asChild>
                <Link to="/auth">Log in</Link>
              </Button>
              <Button className="bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-full px-6" asChild>
                <Link to="/auth">Sign up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
