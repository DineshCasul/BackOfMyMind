import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <Layout>
      <h2 className="text-2xl font-semibold mb-4">Welcome back 👋</h2>
      <p className="mb-6">Start journaling your dreams today.</p>
      <Button>Add New Dream</Button>
    </Layout>
  );
}