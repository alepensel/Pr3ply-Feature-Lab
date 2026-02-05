import { Button } from "@/components/ui/button";
import { TrendingUp, Clock, Heart } from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Increase Your Earnings",
    description: "Teach 2 students in the same hour—multiply your earning potential per session.",
  },
  {
    icon: Clock,
    title: "Better Utilisation",
    description: "Fill more slots with the shared format. More bookings, more consistency.",
  },
  {
    icon: Heart,
    title: "Engaged Students",
    description: "Students love the social dynamic. Higher retention means repeat bookings.",
  },
];

const ForTutors = () => {
  return (
    <section id="tutors" className="bg-foreground text-background py-20 md:py-28">
      <div className="container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div>
            <span className="inline-block rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground mb-6">
              For Tutors
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
              Teach more, earn more
            </h2>
            <p className="mt-6 text-lg text-background/70">
              Shared Immersion Sessions let you double your student capacity without extra prep. 
              Create themed session templates, set your availability, and watch the bookings come in.
            </p>
            
            <div className="mt-10 space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary">
                    <benefit.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold">{benefit.title}</h3>
                    <p className="text-sm text-background/70">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button size="lg" className="mt-10 bg-background text-foreground hover:bg-background/90 rounded-full px-8 font-semibold">
              Start Teaching Shared Sessions
            </Button>
          </div>
          
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/30 to-primary/10 p-8 lg:p-12">
              <div className="h-full w-full rounded-2xl bg-background/10 backdrop-blur-sm border border-background/20 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl font-extrabold">2×</p>
                  <p className="text-xl font-medium mt-2">GMV per hour</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForTutors;
