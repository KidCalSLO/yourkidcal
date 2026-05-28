import { supabase } from './lib/supabase'

export default async function sitemap() {
  const { data: listings } = await supabase
    .from('listings')
    .select('slug, created_at')
    .eq('status', 'approved')
    .not('slug', 'is', null)

  const programUrls = (listings || []).map(l => ({
    url: `https://yourkidcal.com/programs/${l.slug}`,
    lastModified: new Date(l.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    {
      url: 'https://yourkidcal.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...programUrls,
  ]
}
