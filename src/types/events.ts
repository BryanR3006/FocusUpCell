/**
 * Event and calendar-related type definitions
 * IMPORTANT: Backend returns camelCase properties for GET responses
 */

export interface IEvento {
  idEvento: number;                    // Backend returns camelCase
  nombreEvento: string;               // Backend returns camelCase
  descripcionEvento?: string;         // Backend returns camelCase
  fechaEvento: string;                // Backend returns camelCase
  horaEvento: string;                 // Backend returns camelCase
  tipoEvento?: string;                // Backend returns camelCase
  estado?: 'pending' | 'completed' | null; // Estado en inglés
  idUsuario: number;                  // Backend returns camelCase
  fechaCreacion?: string;             // Backend returns camelCase
  fechaActualizacion?: string;        // Backend returns camelCase

  // Relaciones (pueden venir del backend)
  metodo?: {
    idMetodo: number;
    nombreMetodo: string;
    descripcion: string;
  };
  album?: {
    idAlbum: number;
    nombreAlbum: string;
    genero: string;
  };
}

// Para crear, usa camelCase porque el backend espera camelCase en POST
export interface IEventoCreate {
  nombreEvento: string;         // camelCase para POST
  fechaEvento: string;          // camelCase para POST
  horaEvento: string;           // camelCase para POST
  descripcionEvento?: string;   // camelCase para POST
  tipoEvento?: string;          // camelCase para POST
  idUsuario: number;            // camelCase para POST
  idMetodo?: number;            // camelCase para POST
  idAlbum?: number;             // camelCase para POST
  estado?: 'pending' | 'completed' | null;
}

// Para actualizar, usa camelCase porque el backend espera camelCase en PUT/PATCH
export interface IEventoUpdate {
  nombreEvento?: string;
  fechaEvento?: string;
  horaEvento?: string;
  descripcionEvento?: string;
  tipoEvento?: string;
  estado?: 'pending' | 'completed' | null;
  idMetodo?: number;
  idAlbum?: number;
}