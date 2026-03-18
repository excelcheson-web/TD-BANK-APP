
import { createClient } from './utils/supabase/server'

type Todo = {
  id: string;
  name: string;
};

export default async function Page() {
  const supabase = await createClient();
  const { data: todos } = await supabase.from('todos').select();
  return (
    <ul>
      {todos?.map((todo: Todo) => (
        <li key={todo.id}>{todo.name}</li>
      ))}
    </ul>
  );
}
