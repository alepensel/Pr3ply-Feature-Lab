import BrandMark from "@/components/BrandMark";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-background py-3">
      <div className="container flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BrandMark className="h-6" />
            <span className="text-xs text-muted-foreground hidden sm:inline">Shared Immersion Sessions Prototype</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Support</a>
          </div>

          <p className="text-[10px] text-muted-foreground hidden md:block">© 2026 Ale Pensel. Independent product-management portfolio prototype. Not affiliated with Preply.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
