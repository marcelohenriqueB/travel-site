import heroImage from './assets/hero-amazonia.jpg'

export const featuredPlaces = [
  {
    name: 'Manaus',
    image: heroImage,
  },
  {
    name: 'Tefe',
    image:
      'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Parintins',
    image:
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=900&q=80',
  },
  {
    name: 'Tabatinga',
    image:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80',
  },
]

export const popularRoutes = [
  {
    from: 'Manaus',
    to: 'Parintins',
    image:
      'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=300&q=80',
  },
  {
    from: 'Manaus',
    to: 'Tefe',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=300&q=80',
  },
  {
    from: 'Manaus',
    to: 'Borba',
    image:
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=300&q=80',
  },
  {
    from: 'Manaus',
    to: 'Novo Aripuana',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80',
  },
]

export const tickets = [
  {
    id: 22,
    boat: 'F/B M Monteiro II',
    type: 'Embarcacao regional',
    origin: 'Manaus',
    destination: 'Parintins',
    departure: '2026-07-03',
    arrival: '2026-07-09',
    price: 'R$ 510,00',
    image:
      'https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 23,
    boat: 'F/B E Araujo',
    type: 'Embarcacao regional',
    origin: 'Manaus',
    destination: 'Tefe',
    departure: '2026-06-26',
    arrival: '2026-07-03',
    price: 'R$ 510,00',
    image:
      'https://images.unsplash.com/photo-1605281317010-fe5ffe798166?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 24,
    boat: 'N/M Oliveira II',
    type: 'Navio motor',
    origin: 'Manaus',
    destination: 'Novo Aripuana',
    departure: '2026-06-27',
    arrival: '2026-07-03',
    price: 'R$ 510,00',
    image:
      'https://images.unsplash.com/photo-1534008897995-27a23e859048?auto=format&fit=crop&w=700&q=80',
  },
  {
    id: 25,
    boat: 'F/B Samuma',
    type: 'Embarcacao expressa',
    origin: 'Manaus',
    destination: 'Borba',
    departure: '2026-06-30',
    arrival: '2026-07-06',
    price: 'R$ 510,00',
    image:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=700&q=80',
  },
]

export const destinationChips = [
  'Parintins',
  'Novo Aripuana',
  'Sao Paulo de Olivenca',
  'Santo Antonio do Ica',
  'Tefe',
]
