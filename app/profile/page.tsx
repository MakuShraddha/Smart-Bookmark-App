"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";

// Dynamic imports for Recharts (SSR disabled)
const BarChart = dynamic(() =>
  import("recharts").then((mod) => mod.BarChart),
  { ssr: false }
);
const Bar = dynamic(() =>
  import("recharts").then((mod) => mod.Bar),
  { ssr: false }
);
const XAxis = dynamic(() =>
  import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(() =>
  import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const Tooltip = dynamic(() =>
  import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(() =>
  import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);

  const [totalBookmarks, setTotalBookmarks] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  // Get user on mount
  useEffect(() => {
    getUser();
  }, []);

  // Fetch stats when user is available
  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  async function getUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      router.push("/"); // Redirect if not logged in
    } else {
      setUser(data.user);
    }
  }

  async function fetchStats() {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    // Stats calculations
    setTotalBookmarks(data.length);

    const uniqueCategories = [...new Set(data.map((item) => item.category))];
    setTotalCategories(uniqueCategories.length);

    // Weekly chart data
    const last7Days: any = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      last7Days[key] = 0;
    }

    data.forEach((item) => {
      const created = new Date(item.created_at);
      const diff =
        (new Date().getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      if (diff <= 7) {
        const key = created.toLocaleDateString("en-US", { weekday: "short" });
        if (last7Days[key] !== undefined) last7Days[key]++;
      }
    });

    setWeeklyData(
      Object.keys(last7Days).map((key) => ({ name: key, value: last7Days[key] }))
    );
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!user) return null;

  return (
    <div
      className={`min-h-screen p-6 transition-all duration-500 ${
        darkMode
          ? "bg-[#1e1b18] text-[#f5e6d3]"
          : "bg-gradient-to-br from-[#f5e6d3] to-[#e8d8c3] text-[#4b2e1e]"
      }`}
    >
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
          <h1 className="text-3xl font-extrabold">👤 My Profile & Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-2 border-2 rounded-lg font-semibold"
            >
              {darkMode ? "☀ Light" : "🌙 Dark"}
            </button>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 border-2 rounded-lg font-semibold"
            >
              Home
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg font-semibold hover:bg-red-600 hover:text-white transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* USER INFO CARD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#fffaf3] p-8 rounded-2xl shadow-md border-2 border-[#5c3a21] mb-10"
        >
          <div className="mb-6">
            <label className="block text-[#5c3a21] font-bold mb-2">Email</label>
            <div className="p-3 rounded-lg border-2 border-[#5c3a21] font-semibold bg-white">
              {user.email}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-[#5c3a21] font-bold mb-2">User ID</label>
            <div className="p-3 rounded-lg border-2 border-[#5c3a21] font-semibold bg-white break-all">
              {user.id}
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-[#5c3a21] font-bold mb-2">
              Account Created
            </label>
            <div className="p-3 rounded-lg border-2 border-[#5c3a21] font-semibold bg-white">
              {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        </motion.div>

        {/* STATS CARDS */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 rounded-2xl shadow-md border-2 bg-[#fffaf3] border-[#5c3a21]"
          >
            <h3 className="font-bold mb-2">Total Bookmarks</h3>
            <p className="text-3xl font-extrabold">{totalBookmarks}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 rounded-2xl shadow-md border-2 bg-[#fffaf3] border-[#5c3a21]"
          >
            <h3 className="font-bold mb-2">Categories</h3>
            <p className="text-3xl font-extrabold">{totalCategories}</p>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 rounded-2xl shadow-md border-2 bg-[#fffaf3] border-[#5c3a21]"
          >
            <h3 className="font-bold mb-2">Last 7 Days</h3>
            <p className="text-3xl font-extrabold">
              {weeklyData.reduce((acc, cur) => acc + cur.value, 0)}
            </p>
          </motion.div>
        </div>

        {/* WEEKLY CHART */}
        <motion.div className="p-8 rounded-2xl shadow-md border-2 bg-[#fffaf3] border-[#5c3a21]">
          <h2 className="text-xl font-bold mb-6">Weekly Bookmark Activity</h2>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <BarChart data={weeklyData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
