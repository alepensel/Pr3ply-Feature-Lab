import { Users, Shield, Repeat, Sparkles } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Real Conversation Practice",
    description: "Practise turn-taking, active listening, and spontaneous reactions with another student—just like real life.",
  },
  {
    icon: Shield,
    title: "Tutor-Moderated & Safe",
    description: "Your tutor guides the conversation, provides prompts, and ensures a comfortable learning environment.",
  },
  {
    icon: Sparkles,
    title: "Themed Scenarios",
    description: "Choose from travel, bar talk, workplace small talk, and more—immersive scenarios that build real confidence.",
  },
  {
    icon: Repeat,
    title: "Build a Habit",
    description: "Repeatable sessions with different partners help you practise consistently and grow week by week.",
  },
];

const Features = () => {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Why Shared Immersion Sessions?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A premium experience that complements your 1-to-1 lessons
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-preply-pink-light text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
