import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fjpdbrvusppbkkejdqnn.supabase.co";
const supabaseAnonKey = "sb_publishable_Y-wwwaBIVGvyY2vc5voftA_RkjT_5BO";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);