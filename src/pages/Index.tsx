import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import SessionsGrid from "@/components/SessionsGrid";
import Testimonials from "@/components/Testimonials";
import HowItWorks from "@/components/HowItWorks";
import ForTutors from "@/components/ForTutors";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Features />
        <SessionsGrid />
        <Testimonials />
        <HowItWorks />
        <ForTutors />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
