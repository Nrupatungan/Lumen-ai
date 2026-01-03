import { Box } from "@mui/material";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { CTASection } from "@/components/landing/CTASection";
import { auth } from "@/auth";

export default async function LandingPage() {
  const session = await auth();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Navbar isAuthenticated={!!session} />

      <main>
        {/* --- Hero Section --- */}
        <HeroSection />

        {/* --- Stats Section --- */}
        <StatsSection />

        {/* --- Features Section --- */}
        <FeaturesSection />

        {/* --- How It Works Section --- */}
        <HowItWorksSection />

        {/* --- Testimonials Section --- */}
        <TestimonialsSection />

        {/* --- Final CTA Section --- */}
        <CTASection />
      </main>

      <Footer />
    </Box>
  );
}
