export interface Student {
  matricula: string;
  name: string;
  phone: string;
  hasCar: boolean;
  carModel?: string;
  carPlate?: string;
  carColor?: string;
  carActiveSpots?: number;
  stopLocation?: LocationPoint;
}

export interface LocationPoint {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export interface ChatMessage {
  id: string;
  senderMatricula: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface Trip {
  id: string;
  creatorMatricula: string;
  creatorName: string;
  creatorPhone: string;
  type: 'carona' | 'uber';
  origin: LocationPoint;
  destination: LocationPoint;
  departureTime: string;
  priceEstimate: number;
  availableSpots: number;
  maxSpots: number;
  status: 'aberta' | 'cheia' | 'finalizada';
  passengers: Student[];
  messages: ChatMessage[];
  customStops?: LocationPoint[];
  carDetails?: {
    model: string;
    plate: string;
    color: string;
  };
}

export const FAMAS_COORDINATES = { lat: -22.401889, lng: -41.810574 }; // Cidade Universitária Macaé, FeMASS

export const CAMPUS_POINT: LocationPoint = {
  name: 'FeMASS (Cidade Universitária)',
  address: 'Rua Aloísio da Silva Gomes, 50 - Granja dos Cavaleiros, Macaé - RJ',
  lat: -22.401889,
  lng: -41.810574
};

export const POPULAR_PLACES: LocationPoint[] = [
  CAMPUS_POINT,
  {
    name: 'Centro',
    address: 'Av. Rui Barbosa, 150 - Centro, Macaé - RJ',
    lat: -22.3787,
    lng: -41.7853
  },
  {
    name: 'Cavaleiros',
    address: 'Av. Atlântica, 1200 - Cavaleiros, Macaé - RJ',
    lat: -22.4082,
    lng: -41.8025
  },
  {
    name: 'Parque Aeroporto',
    address: 'Rua Tancredo Neves, 450 - Parque Aeroporto, Macaé - RJ',
    lat: -22.3422,
    lng: -41.7483
  },
  {
    name: 'Imbetiba',
    address: 'Av. Elias Agostinho, 230 - Imbetiba, Macaé - RJ',
    lat: -22.3831,
    lng: -41.7766
  },
  {
    name: 'Glória',
    address: 'Rua Prof. Walter de Azevedo Filho, 80 - Glória, Macaé - RJ',
    lat: -22.3985,
    lng: -41.8120
  }
];

export const MOCK_STUDENTS: Student[] = [
  {
    matricula: '20231012',
    name: 'Mateus Oliveira',
    phone: '(22) 99887-1111',
    hasCar: true,
    carModel: 'Hyundai HB20',
    carColor: 'Prata',
    carPlate: 'ABC-1D23',
    carActiveSpots: 4
  },
  {
    matricula: '20231045',
    name: 'Isabella Rocha',
    phone: '(22) 99765-2222',
    hasCar: false
  },
  {
    matricula: '20222019',
    name: 'Guilherme Santos',
    phone: '(22) 99123-3333',
    hasCar: true,
    carModel: 'Chevrolet Onix',
    carColor: 'Preto',
    carPlate: 'XYZ-9G87',
    carActiveSpots: 3
  },
  {
    matricula: '20241009',
    name: 'Beatriz Costa',
    phone: '(22) 98844-5555',
    hasCar: false
  },
  {
    matricula: '20221088',
    name: 'Felipe Dias',
    phone: '(22) 99555-7777',
    hasCar: false
  }
];

export const MOCK_INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip_1',
    creatorMatricula: '20231012',
    creatorName: 'Mateus Oliveira',
    creatorPhone: '(22) 99887-1111',
    type: 'carona',
    origin: POPULAR_PLACES[3], // Parque Aeroporto
    destination: CAMPUS_POINT,
    departureTime: '18:15',
    priceEstimate: 6.00,
    availableSpots: 2,
    maxSpots: 4,
    status: 'aberta',
    passengers: [
      { matricula: '20241009', name: 'Beatriz Costa', phone: '(22) 98844-5555', hasCar: false }
    ],
    messages: [
      {
        id: 'msg_1',
        senderMatricula: '20231012',
        senderName: 'Mateus Oliveira',
        text: 'Eae pessoal! Vou passar perto do supermercado às 18:15, tudo bem?',
        timestamp: '17:30'
      },
      {
        id: 'msg_2',
        senderMatricula: '20241009',
        senderName: 'Beatriz Costa',
        text: 'Perfeito Mateus! Te encontro no ponto da praça principal.',
        timestamp: '17:35'
      }
    ],
    carDetails: {
      model: 'Hyundai HB20',
      color: 'Prata',
      plate: 'ABC-1D23'
    }
  },
  {
    id: 'trip_2',
    creatorMatricula: '20231045',
    creatorName: 'Isabella Rocha',
    creatorPhone: '(22) 99765-2222',
    type: 'uber',
    origin: CAMPUS_POINT,
    destination: POPULAR_PLACES[1], // Centro
    departureTime: '22:15',
    priceEstimate: 8.50, // 34.00 total split by 4
    availableSpots: 3,
    maxSpots: 4,
    status: 'aberta',
    passengers: [],
    messages: [
      {
        id: 'msg_3',
        senderMatricula: '20231045',
        senderName: 'Isabella Rocha',
        text: 'Alguém saindo da facul hoje 22:10 para ir pro Centro de Uber? Corrida dá uns R$ 34,00 no total.',
        timestamp: '16:00'
      }
    ]
  },
  {
    id: 'trip_3',
    creatorMatricula: '20222019',
    creatorName: 'Guilherme Santos',
    creatorPhone: '(22) 99123-3333',
    type: 'carona',
    origin: CAMPUS_POINT,
    destination: POPULAR_PLACES[2], // Cavaleiros
    departureTime: '22:10',
    priceEstimate: 5.00,
    availableSpots: 0,
    maxSpots: 3,
    status: 'cheia',
    passengers: [
      { matricula: '20221088', name: 'Felipe Dias', phone: '(22) 99555-7777', hasCar: false },
      { matricula: '20231045', name: 'Isabella Rocha', phone: '(22) 99765-2222', hasCar: false },
      { matricula: '20241009', name: 'Beatriz Costa', phone: '(22) 98844-5555', hasCar: false }
    ],
    messages: [
      {
        id: 'msg_4',
        senderMatricula: '20222019',
        senderName: 'Guilherme Santos',
        text: 'Carona cheia pessoal, partiu Cavaleiros após o término da aula.',
        timestamp: '17:00'
      }
    ],
    carDetails: {
      model: 'Chevrolet Onix',
      color: 'Preto',
      plate: 'XYZ-9G87'
    }
  }
];
