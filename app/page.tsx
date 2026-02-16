"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Recharts dynamic imports for SSR safety
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

interface Bookmark {
  id: string;
  title: string;
  url: string;
  category: string;
  user_id: string;
  created_at?: string;
}

export default function Home() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) fetchBookmarks(user.id);
  }, [user]);

  // ✅ Auth Check
  async function checkUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.push("/login"); // redirect to Google login page
      return;
    }

    setUser(data.user);
    setLoading(false);
  }

  // ✅ Fetch bookmarks
  async function fetchBookmarks(userId: string) {
    const { data, error } = await supabase
      .from("bookmarks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setBookmarks(data || []);

    // Weekly chart data
    const last7Days: any = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      last7Days[key] = 0;
    }

    (data || []).forEach((item) => {
      const created = new Date(item.created_at || "");
      const diff =
        (new Date().getTime() - created.getTime()) /
        (1000 * 60 * 60 * 24);

      if (diff <= 7) {
        const key = created.toLocaleDateString("en-US", { weekday: "short" });
        if (last7Days[key] !== undefined) last7Days[key]++;
      }
    });

    setWeeklyData(
      Object.keys(last7Days).map((key) => ({
        name: key,
        value: last7Days[key],
      }))
    );
  }

  // ✅ Add / Update
  async function addOrUpdateBookmark() {
    if (!title || !url || !user) return;

    if (editId) {
      await supabase
        .from("bookmarks")
        .update({ title, url, category })
        .eq("id", editId);
      setEditId(null);
    } else {
      await supabase
        .from("bookmarks")
        .insert([{ title, url, category, user_id: user.id }]);
    }

    setTitle("");
    setUrl("");
    setCategory("");
    fetchBookmarks(user.id);
  }

  async function deleteBookmark(id: string) {
    await supabase.from("bookmarks").delete().eq("id", id);
    fetchBookmarks(user.id);
  }

  function handleEdit(bookmark: Bookmark) {
    setTitle(bookmark.title || "");
    setUrl(bookmark.url || "");
    setCategory(bookmark.category || "");
    setEditId(bookmark.id);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.category?.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Loading screen instead of blank
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-xl font-semibold">Checking authentication...</p>
      </div>
    );
  }

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
          <h1 className="text-4xl font-extrabold tracking-wide">
            Smart Bookmark Dashboard
          </h1>

          <div className="flex gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-4 py-2 border-2 rounded-lg font-semibold"
            >
              {darkMode ? "☀ Light" : "🌙 Dark"}
            </button>

            <button
              onClick={() => router.push("/profile")}
              className="px-4 py-2 border-2 rounded-lg font-semibold"
            >
              Profile
            </button>

            <button
              onClick={handleLogout}
              className="px-4 py-2 border-2 rounded-lg font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* FORM */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#fffaf3] p-6 rounded-2xl shadow-md border-2 border-[#5c3a21] mb-8"
        >
          <h2 className="text-xl font-bold text-[#5c3a21] mb-4">
            {editId ? "✏️ Edit Bookmark" : "➕ Add Bookmark"}
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-3 rounded-lg border-2 border-[#5c3a21] font-semibold"
            />
            <input
              placeholder="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="p-3 rounded-lg border-2 border-[#5c3a21] font-semibold"
            />
            <input
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-3 rounded-lg border-2 border-[#5c3a21] font-semibold"
            />
          </div>

          <button
            onClick={addOrUpdateBookmark}
            className="mt-4 px-6 py-2 border-2 border-[#5c3a21] font-bold rounded-lg"
          >
            {editId ? "Update" : "Add"}
          </button>
        </motion.div>

        {/* TOTAL */}
        <div className="mb-10">
          <h2 className="font-bold mb-2">Total Bookmarks</h2>
          <p className="text-3xl font-extrabold">{bookmarks.length}</p>
        </div>

        {/* CHART */}
        <div className="mb-10">
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
        </div>

        {/* GRID */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookmarks.map((bookmark) => (
            <motion.div
              key={bookmark.id}
              whileHover={{ scale: 1.04 }}
              className="bg-[#fffaf3] p-5 rounded-2xl shadow-md border-2 border-[#5c3a21]"
            >
              <h3 className="font-bold mb-2">{bookmark.title}</h3>
              <a
                href={bookmark.url}
                target="_blank"
                className="block text-blue-700 underline mb-2 break-words"
              >
                {bookmark.url}
              </a>
              <p className="mb-4">📂 {bookmark.category}</p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(bookmark)}
                  className="px-3 py-1 border-2 rounded-lg"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteBookmark(bookmark.id)}
                  className="px-3 py-1 border-2 border-red-600 text-red-600 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
