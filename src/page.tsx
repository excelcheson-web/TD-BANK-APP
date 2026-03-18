
import { createClient } from './utils/supabase/server'

type Todo = {
  id: string;
  name: string;
};

export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('*');
  return (
    <ul>
      {data?.map((profile: any) => (
        <li key={profile.id} style={{ color: '#000000' }}>
          {profile.full_name} — {profile.email}
        </li>
      ))}
    </ul>
  );
}
