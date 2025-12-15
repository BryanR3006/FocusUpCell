// Mapeo local de métodos de estudio con imágenes y colores locales
export const LOCAL_METHOD_ASSETS: Record<string, { image: string; color: string }> = {
  'Método Pomodoro': {
    image: 'https://example.com/img/MetodoPomodoro.png', // Usar URLs absolutas en React Native
    color: '#E53935'
  },
  'Mapas Mentales': {
    image: 'https://example.com/img/MapasMentales.png',
    color: '#10B981'
  },
  'Repaso Espaciado': {
    image: 'https://example.com/img/RepasoEspaciado.png',
    color: '#7E57C2'
  },
  'Práctica Activa': {
    image: 'https://example.com/img/PracticaActiva.png',
    color: '#43A047'
  },
  'Método Feynman': {
    image: 'https://example.com/img/Feynman.png',
    color: '#FFD54F'
  },
  'Método Cornell': {
    image: 'https://example.com/img/Cornell.png',
    color: '#3B82F6'
  }
};

// Función para sobrescribir datos de método con activos locales
export const overrideMethodWithLocalAssets = (method: any): any => {
  if (!method || typeof method.nombre_metodo !== 'string') return method;

  const localAssets = LOCAL_METHOD_ASSETS[method.nombre_metodo];
  if (localAssets) {
    return {
      ...method,
      url_imagen: localAssets.image,
      color_hexa: localAssets.color
    };
  }

  return method;
};

// Función para obtener el color de un método por nombre
export const getMethodColor = (methodName: string): string => {
  const assets = LOCAL_METHOD_ASSETS[methodName];
  return assets ? assets.color : '#000000'; // Color por defecto si no se encuentra
};

// Función para sobrescribir array de métodos con activos locales
export const overrideMethodsWithLocalAssets = (methods: any[]): any[] => {
  if (!Array.isArray(methods)) return methods;

  return methods.map(overrideMethodWithLocalAssets);
};