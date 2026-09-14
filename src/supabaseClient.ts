import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tyyghkiygzoiqbginiqc.supabase.co/rest/v1/'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_6j2YxV-6eoEpLgJ_zEGucQ_g09exVMm'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
