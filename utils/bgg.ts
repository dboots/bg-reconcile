// utility functions for interacting with the BoardGameGeek XML API

const AUTH_HEADER = {
  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_BGG_AUTH_TOKEN}`
};

export async function searchGames(query: string) {
  const url = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query)}&type=boardgame`;
  const resp = await fetch(url, { headers: AUTH_HEADER });
  if (!resp.ok) throw new Error('Failed to search games');
  const text = await resp.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');
  const items = xmlDoc.querySelectorAll('item');
  return Array.from(items).map((item) => ({
    id: item.getAttribute('id') || '',
    name: item.querySelector('name')?.getAttribute('value') || '',
  }));
}

export async function getGameDetails(id: string) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${id}`;
  const resp = await fetch(url, { headers: AUTH_HEADER });
  if (!resp.ok) throw new Error('Failed to fetch game data');
  const text = await resp.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');
  const item = xmlDoc.querySelector('item');
  if (!item) throw new Error('Game not found');
  const name = item.querySelector('name')?.getAttribute('value');
  const image = item.querySelector('image')?.textContent || "/images/placeholder.jpg";
  if (!name) throw new Error('Game name not found');
  return { name, image };
}
