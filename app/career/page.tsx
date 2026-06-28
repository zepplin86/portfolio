import Navbar from "@/components/Navbar";
import CareerDetail from "@/components/CareerDetail";
import Footer from "@/components/Footer";

export default function CareerPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        <CareerDetail />
      </main>
      <Footer />
    </>
  );
}
