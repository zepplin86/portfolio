import Navbar from "@/components/Navbar";
import Projects from "@/components/Projects";
import Footer from "@/components/Footer";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company } = await searchParams;

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Projects companyFilter={company} />
      </main>
      <Footer />
    </>
  );
}
