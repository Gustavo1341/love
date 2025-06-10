import { put } from '@vercel/blob';

/*
export const config = {
  runtime: 'edge',
};
*/

export default async function handler(request) {
  console.log("Upload function started.");

  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return new Response(JSON.stringify({ message: 'No filename provided.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log(`Attempting to upload file: ${filename}`);
    const blob = await put(filename, request.body, {
      access: 'public',
    });
    console.log("File uploaded successfully:", blob.url);

    return new Response(JSON.stringify(blob), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('UPLOAD_API_ERROR:', error);
    return new Response(JSON.stringify({ message: 'Error uploading file.', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 