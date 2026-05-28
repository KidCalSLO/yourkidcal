import { supabase } from '../lib/supabase'
import HomeClient from './HomeClient'

export const revalidate = 60

export default async function Home() {
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'approved')
    .order('reg_close', { ascending: true })

  return <HomeClient listings={listings || []} />
}
