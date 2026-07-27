"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package, Layers, Inbox, Users, Download, Moon, Sun, RefreshCw, LogOut,
  Mail, Phone, MapPin, Search, LayoutDashboard, ChevronRight, ShieldCheck,
  KeyRound, RotateCcw, Globe,
} from "lucide-react";

interface Inquiry {
  id: string; createdAt: string; customerName: string; companyName: string | null;
  email: string | null; country: string; phone: string; productName: string; quantity: number; message: string | null;
}
interface Props {
  data: {
    adminName: string; adminImage: string | null;
    stats: { products: number; categories: number; inquiries: number };
    inquiries: Inquiry[];
  };
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const timeAgo = (iso: string) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return fmtDate(iso);
};
const fmtNum = (n: number) => n.toLocaleString("en-US");
type Section = "overview" | "inquiries";

function Avatar({ name, email, image, size = 36 }: { name: string | null; email: string; image: string | null; size?: number }) {
  if (image) {
    // Plain <img>: user photos are arbitrary (Google URLs or data URLs), so
    // we skip next/image's host allow-listing / optimization here.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className="rounded-full object-cover border border-black/5 shrink-0" style={{ width: size, height: size }} />;
  }
  return <span className="rounded-full bg-brand text-white flex items-center justify-center font-bold uppercase shrink-0" style={{ width: size, height: size, fontSize: size * 0.4 }}>{(name || email)[0]}</span>;
}

export function AdminDashboardClient({ data }: Props) {
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [section, setSection] = useState<Section>("overview");
  const [q, setQ] = useState("");

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const filteredInquiries = data.inquiries.filter(i =>
    !q || `${i.customerName} ${i.productName} ${i.country} ${i.email ?? ""} ${i.phone}`.toLowerCase().includes(q.toLowerCase()));

  const stats = [
    { key: "products", label: "Total Products", value: data.stats.products, icon: Package, tint: "text-sky-500", bg: "bg-sky-500/10" },
    { key: "categories", label: "Categories", value: data.stats.categories, icon: Layers, tint: "text-violet-500", bg: "bg-violet-500/10" },
    { key: "inquiries", label: "Inquiries", value: data.stats.inquiries, icon: Inbox, tint: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const t = dark
    ? { page: "bg-[#0b1120] text-slate-100", panel: "bg-[#0f172a] border-slate-800", card: "bg-[#0f172a] border-slate-800", sub: "text-slate-400", soft: "text-slate-500", head: "text-slate-500", rowHover: "hover:bg-slate-800/40", divide: "divide-slate-800", input: "bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500", navIdle: "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200", chip: "bg-slate-800 text-slate-300" }
    : { page: "bg-slate-100 text-slate-900", panel: "bg-white border-slate-200/70", card: "bg-white border-slate-100", sub: "text-slate-500", soft: "text-slate-400", head: "text-slate-500", rowHover: "hover:bg-slate-50", divide: "divide-slate-100", input: "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400", navIdle: "text-slate-500 hover:bg-slate-100 hover:text-slate-900", chip: "bg-slate-100 text-slate-500" };

  const nav: { key: Section; label: string; icon: any; count?: number }[] = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "inquiries", label: "Inquiries", icon: Inbox, count: data.stats.inquiries },
  ];

  return (
    <div className={`min-h-screen w-full pt-20 transition-colors duration-200 ${t.page}`}>
      <div className="flex">
        {/* Sidebar */}
        <aside className={`hidden lg:flex w-64 shrink-0 flex-col border-r ${t.panel} sticky top-20 h-[calc(100vh-5rem)] p-4 transition-colors duration-200`}>
          <div className="px-2 py-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand">Affhan Admin</p>
            <p className={`text-xs ${t.soft} mt-0.5`}>Control Center</p>
          </div>
          <nav className="mt-3 flex-1 space-y-1">
            {nav.map(n => (
              <button key={n.key} onClick={() => setSection(n.key)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${section === n.key ? "bg-brand text-white shadow-sm" : t.navIdle}`}>
                <n.icon size={18} /><span className="flex-1 text-left">{n.label}</span>
                {n.count !== undefined && <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${section === n.key ? "bg-white/20" : t.chip}`}>{fmtNum(n.count)}</span>}
              </button>
            ))}
          </nav>
          <div className={`border-t ${t.divide} pt-3`}>
            <div className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl transition-colors ${t.navIdle}`}>
              <Avatar name={data.adminName} email={data.adminName} image={data.adminImage} size={36} />
              <span className="min-w-0 text-left flex-1"><span className="block text-sm font-bold truncate">{data.adminName}</span><span className={`block text-[11px] ${t.soft}`}>Administrator</span></span>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setDark(d => !d)} className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${t.card} ${t.sub} hover:text-brand`}>
                {dark ? <Sun size={14} /> : <Moon size={14} />}{dark ? "Light" : "Dark"}
              </button>
              <button onClick={logout} className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 p-5 sm:p-8">
          {/* Topbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight capitalize">{section === "overview" ? "Dashboard Overview" : section}</h1>
              <p className={`text-sm ${t.sub} mt-0.5`}>Welcome back, {data.adminName.split(" ")[0]}.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Mobile section switch + dark/logout */}
              <div className="flex lg:hidden gap-2">
                {nav.map(n => (
                  <button key={n.key} onClick={() => setSection(n.key)} className={`px-3 py-2 rounded-lg text-xs font-bold ${section === n.key ? "bg-brand text-white" : `${t.card} border ${t.sub}`}`}>{n.label}</button>
                ))}
              </div>
              <button onClick={() => router.refresh()} className={`inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold ${t.card} ${t.sub} hover:text-brand transition-colors`}><RefreshCw size={16} /> <span className="hidden sm:inline">Refresh</span></button>
              <button onClick={() => setDark(d => !d)} className={`lg:hidden inline-flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold ${t.card} ${t.sub}`}>{dark ? <Sun size={16} /> : <Moon size={16} />}</button>
              <button onClick={logout} className="lg:hidden inline-flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500"><LogOut size={16} /></button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {stats.map(s => (
              <button key={s.key} onClick={() => setSection(s.key === "products" || s.key === "categories" ? "overview" : (s.key as Section))} className={`text-left rounded-2xl border p-5 transition-all ${t.card} hover:shadow-md hover:-translate-y-0.5`}>
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.tint}`} /></div>
                </div>
                <p className="mt-3 text-2xl sm:text-3xl font-black">{fmtNum(s.value)}</p>
                <p className={`text-xs font-bold uppercase tracking-wider ${t.sub} mt-0.5`}>{s.label}</p>
              </button>
            ))}
          </div>

          {section === "overview" ? (
            <div className="grid lg:grid-cols-2 gap-4">
              <OverviewList title="Recent Inquiries" onView={() => setSection("inquiries")} t={t} empty="No inquiries yet." items={data.inquiries.slice(0, 6).map(i => (
                <div key={i.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{i.productName}</p>
                    <p className={`text-xs ${t.sub} truncate`}>{i.customerName} · {i.country}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand-dark shrink-0">Qty {i.quantity}</span>
                </div>
              ))} />

            </div>
          ) : (
            <div className={`rounded-2xl border ${t.card}`}>
              <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-inherit">
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input value={q} onChange={e => setQ(e.target.value)} placeholder={`Search ${section}…`} className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-brand/30 ${t.input}`} />
                </div>
                  <a href="/api/admin/export/" className="sm:ml-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                    <Download size={16} /> Export (Excel)
                  </a>
              </div>

              <div className="overflow-x-auto">

                  <table className={`min-w-full divide-y ${t.divide}`}>
                    <thead><tr className={`text-left text-xs font-bold uppercase tracking-wider ${t.head}`}>
                      <th className="px-6 py-3.5">Date</th><th className="px-6 py-3.5">Customer</th><th className="px-6 py-3.5">Product</th><th className="px-6 py-3.5">Qty</th><th className="px-6 py-3.5">Contact</th>
                    </tr></thead>
                    <tbody className={`divide-y ${t.divide}`}>
                      {filteredInquiries.length ? filteredInquiries.map(i => (
                        <tr key={i.id} className={t.rowHover}>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${t.sub}`}>{fmtDate(i.createdAt)}</td>
                          <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-bold">{i.customerName}</div><div className={`text-xs flex items-center gap-1 ${t.sub}`}><MapPin size={11} />{i.country}</div></td>
                          <td className="px-6 py-4 text-sm font-semibold max-w-xs truncate">{i.productName}</td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand/10 text-brand-dark">{i.quantity}</span></td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${t.sub}`}><div className="flex items-center gap-1"><Phone size={12} />{i.phone}</div>{i.email && <div className="flex items-center gap-1 text-xs mt-0.5"><Mail size={11} />{i.email}</div>}</td>
                        </tr>
                      )) : <tr><td colSpan={5} className={`px-6 py-16 text-center text-sm ${t.sub}`}>No inquiries found.</td></tr>}
                    </tbody>
                  </table>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// How a password change happened: a signed-in self-service change vs. an OTP
// "forgot password" reset.
function MethodBadge({ method }: { method: string }) {
  if (method === "reset-otp") {
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600"><RotateCcw size={12} /> OTP reset</span>;
  }
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-600"><KeyRound size={12} /> Self-service</span>;
}

function OverviewList({ title, items, onView, empty, t }: { title: string; items: React.ReactNode[]; onView: () => void; empty: string; t: any }) {
  return (
    <div className={`rounded-2xl border ${t.card}`}>
      <div className="px-5 py-4 flex items-center justify-between border-b border-inherit">
        <h3 className="font-bold">{title}</h3>
        <button onClick={onView} className="text-xs font-bold text-brand-dark hover:opacity-80 flex items-center gap-1">View all <ChevronRight size={14} /></button>
      </div>
      <div className={`px-5 divide-y ${t.divide}`}>
        {items.length ? items : <p className={`py-10 text-center text-sm ${t.sub}`}>{empty}</p>}
      </div>
    </div>
  );
}
