import { createClient } from '@supabase/supabase-js';

const SUPABASE_PROJECT_REF =
  import.meta.env.VITE_SUPABASE_PROJECT_REF || 'dtmzgodvtylhzhpmzeta';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || `https://${SUPABASE_PROJECT_REF}.supabase.co`;

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'sb_publishable_F_GIa0jrgrSEK1ygaa1U3w_HWakhIZC';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const REALTIME_CHANNEL = 'ccc-tournament-live';
