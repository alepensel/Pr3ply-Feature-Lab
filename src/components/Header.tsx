import { Link, useNavigate } from "react-router-dom";
import preplyLogo from "@/assets/preply-logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, Calendar } from "lucide-react";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={preplyLogo} alt="Preply" className="h-10 md:h-12 w-auto" />
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#sessions" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            Browse Sessions
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            How it Works
          </a>
          <a href="#tutors" className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
            For Tutors
          </a>
        </nav>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="text-sm font-medium gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">My Sessions</span>
              </Button>
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="max-w-[150px] truncate">{user.email}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
                className="text-sm font-medium gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Log out</span>
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
