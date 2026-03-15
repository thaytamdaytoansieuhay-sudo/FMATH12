import { createClient } from "@supabase/supabase-js";

// Thông tin kết nối Supabase
const SUPABASE_URL = "https://oxryrnyjznjrndryufxt.supabase.co";
// Lưu ý: Key "sb_publishable_..." bạn cung cấp trông có vẻ khác với chuẩn Anon Key (thường bắt đầu bằng "eyJ...").
// Nếu gặp lỗi 401 Unauthorized, vui lòng kiểm tra lại Key trong Project Settings > API của Supabase.
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94cnlybnlqem5qcm5kcnl1Znh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyNTU0MjIsImV4cCI6MjA4NTgzMTQyMn0.lx7p1pKYA0tYRDgGr6NTiF2Gu3-Nyy4lUy93OiTD7Ps"; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
