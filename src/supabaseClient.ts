import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://aucdcaethhzxmuhpcrpd.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Fdkca2TLfOEwoeQ4Un95Eg_BWW5jTaY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
