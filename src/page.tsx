
import { createClient } from './utils/supabase/server'

type Todo = {
  id: string;
  name: string;
};

// Example user object; replace with actual user context or prop
const user = { id: '' }; // <-- Set this to the actual user id

export default async function Page() {
  const supabase = await createClient();
  let profile = null;
  if (user?.id) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    profile = data;
  }
  return (
    <ul>
      {profile ? (
        <li key={profile.id} style={{ color: '#000000' }}>
          {profile?.full_name || 'Loading...'} — {profile?.email}
        </li>
      ) : (
        <li>Loading...</li>
      )}
    </ul>
  );
}
