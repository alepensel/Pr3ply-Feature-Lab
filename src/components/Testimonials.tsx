import { Star, Quote } from "lucide-react";
import { students, tutor } from "@/data/mockData";

const RatingBar = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center gap-3">
    <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
    <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${(value / 5) * 100}%` }}
      />
    </div>
    <span className="text-sm font-semibold w-8 text-right">{value}</span>
  </div>
);

const Testimonials = () => {
  const { lessonRating } = tutor;

  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container">
        {/* Tutor Feature */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <div className="inline-flex items-center gap-4 rounded-2xl border border-border bg-card p-6 shadow-lg">
            <img
              src={tutor.avatar}
              alt={tutor.name}
              className="h-20 w-20 rounded-full object-cover border-4 border-primary"
            />
            <div className="text-left">
              <h3 className="text-xl font-bold text-foreground">{tutor.name}</h3>
              <p className="text-sm text-muted-foreground mb-1">
                From {tutor.country} · TEFL Certified · {tutor.yearsExperience} years experience
              </p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold">{tutor.rating}</span>
                </div>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{tutor.reviewCount} reviews</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm text-muted-foreground">{tutor.lessonCount.toLocaleString()} lessons</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lesson Rating */}
        <div className="mx-auto max-w-md mb-16 rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6 text-center">Lesson Rating</h3>
          <div className="space-y-4">
            <RatingBar label="Reassurance" value={lessonRating.reassurance} />
            <RatingBar label="Clarity" value={lessonRating.clarity} />
            <RatingBar label="Progress" value={lessonRating.progress} />
            <RatingBar label="Preparation" value={lessonRating.preparation} />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Based on {lessonRating.basedOn} anonymous student reviews
          </p>
        </div>

        {/* What my students say */}
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            What students say about Maya
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Synthetic demo testimonials based on realistic learner goals
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <div
              key={student.id}
              className="relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-shadow"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
              
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={student.avatar}
                  alt={student.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-foreground">{student.name}</p>
                  <p className="text-xs text-muted-foreground">{student.date}</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                "{student.review}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
