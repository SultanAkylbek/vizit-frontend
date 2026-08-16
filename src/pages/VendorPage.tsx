import { Layout } from "../Layout";
import { VendorDashboard } from "./VendorDashboard";

export default function VendorPage() {
  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-3xl font-semibold text-[#ececec]">Добавление места</h1>
        <p className="mb-6 text-sm text-white/50">
          Здесь вы можете отправить новое место в каталог. После успешного добавления оно станет доступно в ответах чата.
        </p>
        <VendorDashboard />
      </div>
    </Layout>
  );
}
