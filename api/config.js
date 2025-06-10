import { sql } from '@vercel/postgres';

/*
export const config = {
  runtime: 'edge',
};
*/

async function handler(request) {
  try {
    if (request.method === 'GET') {
      try {
        const { rows } = await sql`SELECT * FROM couple_config LIMIT 1;`;
        return new Response(JSON.stringify(rows[0] || null), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        if (error.message.includes('relation "couple_config" does not exist')) {
          console.log('Table "couple_config" does not exist, creating...');
          await sql`
            CREATE TABLE couple_config (
              id SERIAL PRIMARY KEY,
              couple_name VARCHAR(255),
              relationship_start TIMESTAMPTZ,
              background_music_url TEXT,
              photos JSONB,
              custom_phrase TEXT
            );
          `;
          return new Response(JSON.stringify(null), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        throw error;
      }
    } else if (request.method === 'POST') {
      const config = await request.json();
      const { id, couple_name, relationship_start, background_music_url, photos, custom_phrase } = config;

      if (id) {
        const { rows } = await sql`
          UPDATE couple_config
          SET 
            couple_name = ${couple_name}, 
            relationship_start = ${relationship_start}, 
            background_music_url = ${background_music_url}, 
            photos = ${JSON.stringify(photos)}, 
            custom_phrase = ${custom_phrase}
          WHERE id = ${id}
          RETURNING *;
        `;
        return new Response(JSON.stringify(rows[0]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        const { rows } = await sql`
          INSERT INTO couple_config (couple_name, relationship_start, background_music_url, photos, custom_phrase)
          VALUES (${couple_name}, ${relationship_start}, ${background_music_url}, ${JSON.stringify(photos)}, ${custom_phrase})
          RETURNING *;
        `;
        return new Response(JSON.stringify(rows[0]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response('Method Not Allowed', { status: 405 });
    }
  } catch (error) {
    console.error('Config API Error:', error);
    return new Response(JSON.stringify({ message: 'Server Error', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export default handler; 