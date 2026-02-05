import { Search, CalendarCheck, Video, MessageSquare } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "01",
    title: "Browse & Choose",
    description: "Find a session that matches your language, level, and interests. View the theme, tutor profile, and timing.",
  },
  {
    icon: CalendarCheck,
    step: "02",
    title: "Book Your Spot",
    description: "Reserve one of two student spots. You'll be matched with another learner at a similar level.",
  },
  {
    icon: Video,
    step: "03",
    title: "Join the Session",
    description: "Connect via video with your tutor and conversation partner. The tutor guides the structured scenario.",
  },
  {
    icon: MessageSquare,
    step: "04",
    title: "Practice & Grow",
    description: "Engage in authentic dialogue, receive real-time guidance, and build confidence through repetition.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Four simple steps to authentic conversation practice
          </p>
        </div>
        
        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-border lg:block" />
          
          <div className="space-y-12 lg:space-y-0">
            {steps.map((item, index) => (
              <div
                key={index}
                className={`relative flex flex-col lg:flex-row ${
                  index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                } items-center gap-8 lg:gap-16`}
              >
                {/* Content */}
                <div className={`flex-1 ${index % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                  <div className={`inline-block ${index % 2 === 0 ? "lg:ml-auto" : ""}`}>
                    <span className="text-6xl font-extrabold text-primary/20">
                      {item.step}
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 max-w-md text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                
                {/* Icon circle */}
                <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-4 border-background bg-primary shadow-lg">
                  <item.icon className="h-7 w-7 text-primary-foreground" />
                </div>
                
                {/* Spacer for alignment */}
                <div className="flex-1 hidden lg:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
