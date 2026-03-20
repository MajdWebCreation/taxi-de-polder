import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#f6f4ee] px-4 py-16">
      <div className="mx-auto max-w-md rounded-[2rem] border border-[#0b5a4e]/10 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,32,0.06)]">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#0b5a4e]">
          Taxi De Polder
        </p>
        <h1 className="mt-4 text-3xl font-black text-[#0f1720]">
          Admin login
        </h1>
        <p className="mt-3 text-[#475569]">
          Alleen voor beheer van tarieven en speciale ritprijzen.
        </p>

        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
