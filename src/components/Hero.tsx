import { Button } from "@/components/ui/button";
import { Users, Sparkles, MessageCircle } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-preply-pink-light py-20 md:py-32">
      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-semibold shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>New Feature</span>
          </div>
          
          {/* Headline */}
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl lg:text-7xl">
            <span className="inline-block rounded-lg bg-foreground px-3 py-1 text-background">
              Practice
            </span>{" "}
            real conversations with{" "}
            <span className="inline-block rounded-lg bg-foreground px-3 py-1 text-background">
              real people
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Shared Immersion Sessions: Join a tutor-led conversation with one other student. 
            Experience authentic dialogue in travel, social, and workplace scenarios.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-6 text-lg font-semibold shadow-lg">
              <Users className="mr-2 h-5 w-5" />
              Browse Sessions
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg font-semibold border-2 border-foreground hover:bg-foreground hover:text-background">
              <MessageCircle className="mr-2 h-5 w-5" />
              Learn More
            </Button>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-4xl font-extrabold text-foreground">2</p>
              <p className="text-sm text-muted-foreground">Students per session</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-extrabold text-foreground">1</p>
              <p className="text-sm text-muted-foreground">Expert tutor</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-extrabold text-foreground">B1–C1</p>
              <p className="text-sm text-muted-foreground">Language levels</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
    </section>
  );
};

export default Hero;
