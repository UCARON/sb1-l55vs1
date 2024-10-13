import { createClient } from '@supabase/supabase-js';

export default {
  async fetch(request, env) {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/api/scores' && request.method === 'POST') {
      return handlePostScore(request, supabase);
    } else if (path === '/api/scores' && request.method === 'GET') {
      return handleGetScores(supabase);
    } else if (path === '/api/bosses' && request.method === 'GET') {
      return handleGetBosses(supabase);
    } else if (path === '/api/register' && request.method === 'POST') {
      return handleRegister(request, supabase);
    } else if (path === '/api/login' && request.method === 'POST') {
      return handleLogin(request, supabase);
    } else if (path === '/api/user' && request.method === 'GET') {
      return handleGetUser(request, supabase);
    } else if (path === '/api/user' && request.method === 'PATCH') {
      return handleUpdateUser(request, supabase);
    } else {
      return new Response('Not Found', { status: 404 });
    }
  }
};

async function handlePostScore(request, supabase) {
  const { user_id, score } = await request.json();
  const { data: userData } = await supabase.auth.getUser(user_id);

  if (!userData) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { data, error } = await supabase
    .from('scores')
    .insert({ user_id, score });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ message: 'Score saved successfully' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGetScores(supabase) {
  const { data, error } = await supabase
    .from('scores')
    .select('*, users(username)')
    .order('score', { ascending: false })
    .limit(10);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGetBosses(supabase) {
  const { data, error } = await supabase
    .from('bosses')
    .select('*')
    .order('level', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleRegister(request, supabase) {
  const { email, password, username } = await request.json();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // ユーザープロフィールを作成
  const { error: profileError } = await supabase
    .from('users')
    .insert({ id: data.user.id, username, level: 1, experience: 0 });

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ message: 'User registered successfully' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleLogin(request, supabase) {
  const { email, password } = await request.json();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ user: data.user, session: data.session }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleGetUser(request, supabase) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userError) {
    return new Response(JSON.stringify({ error: userError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify(userData), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleUpdateUser(request, supabase) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { experience } = await request.json();

  const { data, error: updateError } = await supabase
    .from('users')
    .update({ experience })
    .eq('id', user.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ message: 'User updated successfully' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
