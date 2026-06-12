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
  },
  {
    name: 'Aroeira',
    address: 'Rua Alcides Mourão, 340 - Aroeira, Macaé - RJ',
    lat: -22.3795,
    lng: -41.8050
  },
  {
    name: 'Imburo',
    address: 'Estrada do Imburo, Macaé - RJ (Zona Rural/Norte)',
    lat: -22.3276,
    lng: -41.7611
  },
  {
    name: 'Glicério',
    address: 'Distrito de Glicério, Macaé - RJ (Região Serrana)',
    lat: -22.2470,
    lng: -42.0550
  }
];

export const MOCK_STUDENTS: Student[] = [
  {
    matricula: '20231012',
    name: 'Yuri Silva',
    phone: '(22) 99887-1111',
    hasCar: true,
    carModel: 'Hyundai HB20',
    carColor: 'Prata',
    carPlate: 'ABC-1D23',
    carActiveSpots: 4,
    stopLocation: {
      name: 'Aroeira',
      address: 'Rua Alcides Mourão, 340 - Aroeira, Macaé - RJ',
      lat: -22.3795,
      lng: -41.8050
    }
  },
  {
    matricula: '20231045',
    name: 'Hannah Hipolito',
    phone: '(22) 99765-2222',
    hasCar: false,
    stopLocation: {
      name: 'Imburo',
      address: 'Estrada do Imburo, Macaé - RJ (Zona Rural/Norte)',
      lat: -22.3276,
      lng: -41.7611
    }
  },
  {
    matricula: '20222019',
    name: 'Jonatan Guimarães',
    phone: '(22) 99123-3333',
    hasCar: true,
    carModel: 'Chevrolet Onix',
    carColor: 'Preto',
    carPlate: 'XYZ-9G87',
    carActiveSpots: 3
  },
  {
    matricula: '20241009',
    name: 'Sara Guedes',
    phone: '(22) 98844-5555',
    hasCar: false
  },
  {
    matricula: '20221088',
    name: 'Lucas Pinto',
    phone: '(22) 99555-7777',
    hasCar: false,
    stopLocation: {
      name: 'Parque Aeroporto',
      address: 'Rua Tancredo Neves, 450 - Parque Aeroporto, Macaé - RJ',
      lat: -22.3422,
      lng: -41.7483
    }
  },
  {
    matricula: '20231099',
    name: 'Vinicius Araujo',
    phone: '(22) 99666-8888',
    hasCar: true,
    carModel: 'Toyota Corolla',
    carColor: 'Branco',
    carPlate: 'VNA-2026',
    carActiveSpots: 4,
    stopLocation: {
      name: 'Glicério',
      address: 'Distrito de Glicério, Macaé - RJ (Região Serrana)',
      lat: -22.2470,
      lng: -42.0550
    }
  }
];

export const MOCK_INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip_1',
    creatorMatricula: '20231012',
    creatorName: 'Yuri Silva',
    creatorPhone: '(22) 99887-1111',
    type: 'carona',
    origin: {
      name: 'Aroeira',
      address: 'Rua Alcides Mourão, 340 - Aroeira, Macaé - RJ',
      lat: -22.3795,
      lng: -41.8050
    },
    destination: CAMPUS_POINT,
    departureTime: '18:15',
    priceEstimate: 5.00,
    availableSpots: 2,
    maxSpots: 4,
    status: 'aberta',
    passengers: [
      { matricula: '20241009', name: 'Sara Guedes', phone: '(22) 98844-5555', hasCar: false }
    ],
    messages: [
      {
        id: 'msg_1',
        senderMatricula: '20231012',
        senderName: 'Yuri Silva',
        text: 'Eae pessoal! Saindo da Aroeira às 18:15 rumo à FeMASS, alguém precisa de carona?',
        timestamp: '17:30'
      },
      {
        id: 'msg_2',
        senderMatricula: '20241009',
        senderName: 'Sara Guedes',
        text: 'Opa Yuri! Pode me pegar no ponto perto do mercado na Aroeira?',
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
    creatorName: 'Hannah Hipolito',
    creatorPhone: '(22) 99765-2222',
    type: 'uber',
    origin: {
      name: 'Imburo',
      address: 'Estrada do Imburo, Macaé - RJ (Zona Rural/Norte)',
      lat: -22.3276,
      lng: -41.7611
    },
    destination: CAMPUS_POINT,
    departureTime: '18:00',
    priceEstimate: 12.00,
    availableSpots: 3,
    maxSpots: 4,
    status: 'aberta',
    passengers: [],
    messages: [
      {
        id: 'msg_3',
        senderMatricula: '20231045',
        senderName: 'Hannah Hipolito',
        text: 'Alguém saindo do Imburo para dividir um Uber até a Cidade Universitária hoje?',
        timestamp: '16:00'
      }
    ]
  },
  {
    id: 'trip_3',
    creatorMatricula: '20231099',
    creatorName: 'Vinicius Araujo',
    creatorPhone: '(22) 99666-8888',
    type: 'carona',
    origin: {
      name: 'Glicério',
      address: 'Distrito de Glicério, Macaé - RJ (Região Serrana)',
      lat: -22.2470,
      lng: -42.0550
    },
    destination: CAMPUS_POINT,
    departureTime: '17:30',
    priceEstimate: 10.00,
    availableSpots: 0,
    maxSpots: 3,
    status: 'cheia',
    passengers: [
      { 
        matricula: '20221088', 
        name: 'Lucas Pinto', 
        phone: '(22) 99555-7777', 
        hasCar: false,
        stopLocation: {
          name: 'Parque Aeroporto',
          address: 'Rua Tancredo Neves, 450 - Parque Aeroporto, Macaé - RJ',
          lat: -22.3422,
          lng: -41.7483
        }
      },
      { matricula: '20241009', name: 'Sara Guedes', phone: '(22) 98844-5555', hasCar: false }
    ],
    messages: [
      {
        id: 'msg_4',
        senderMatricula: '20231099',
        senderName: 'Vinicius Araujo',
        text: 'Descendo a serra de Glicério hoje 17:30. Já combinei com o Lucas do Aeroporto de passarmos para buscar todo mundo.',
        timestamp: '16:30'
      }
    ],
    carDetails: {
      model: 'Toyota Corolla',
      color: 'Branco',
      plate: 'VNA-2026'
    }
  },
  {
    id: 'trip_4',
    creatorMatricula: '20222019',
    creatorName: 'Jonatan Guimarães',
    creatorPhone: '(22) 99123-3333',
    type: 'carona',
    origin: CAMPUS_POINT,
    destination: {
      name: 'Centro',
      address: 'Av. Rui Barbosa, 150 - Centro, Macaé - RJ',
      lat: -22.3787,
      lng: -41.7853
    },
    departureTime: '22:10',
    priceEstimate: 5.00,
    availableSpots: 3,
    maxSpots: 3,
    status: 'aberta',
    passengers: [],
    messages: [
      {
        id: 'msg_5',
        senderMatricula: '20222019',
        senderName: 'Jonatan Guimarães',
        text: 'Carona saindo do campus após a aula rumo ao Centro. Vagas livres!',
        timestamp: '19:00'
      }
    ],
    carDetails: {
      model: 'Chevrolet Onix',
      color: 'Preto',
      plate: 'XYZ-9G87'
    }
  }
];
