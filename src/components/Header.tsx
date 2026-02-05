import preplyLogo from "@/assets/preply-logo.png";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={preplyLogo} alt="Preply" className="h-8 w-auto" />
        </div>
        
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
          <Button variant="ghost" className="text-sm font-medium">
            Log in
          </Button>
          <Button className="bg-foreground text-background hover:bg-foreground/90 font-semibold rounded-full px-6">
            Sign up
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
