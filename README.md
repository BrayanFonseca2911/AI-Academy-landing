# Campuslands AI Academy · Nueva Landing

Rediseño de la landing de **Campuslands AI Academy** aplicando el **Manual de marca v1.0** (noviembre de 2026) y una narrativa espacial de exploración orientada a conversión.

---

## Cómo correr el proyecto

El proyecto está construido en **HTML5, CSS3 y JavaScript vanilla** sin dependencias de compilación para garantizar carga inmediata, máximo rendimiento en móvil (Lighthouse 95+) y cero sobrecarga de paquetes.

### Opción 1 · Servidor local con Python (recomendado)

```bash
python -m http.server 8080
```

Luego abre `http://localhost:8080` en tu navegador.

### Opción 2 · Con Node / `npx`

```bash
npx serve .
```

### Opción 3 · Abrir directamente

Puedes abrir `index.html` directamente en cualquier navegador moderno.

---

## Aplicación del Manual de Marca v1.0

| Elemento | Aplicación en la landing |
| :--- | :--- |
| **Paleta oficial** | Base `Black #050507`, CTAs y bloques destacados en `Evox Purple #7026E8`, halos y energía en `Electric Violet #9636FF`, etiquetas en píldora y una sola palabra destacada por titular en `Soft Violet #B783FF`, titulares en `White #FFFFFF`, textos secundarios en `Muted Gray #8E8998` y texto largo de apoyo en `#DCD6EA`. |
| **Tipografía** | `Poppins` (pesos 400, 500, 600, 700 y 800) como única familia tipográfica en toda la página. |
| **Logo oficial** | Versión horizontal blanca (`logo-horizontal-white.webp`, mínimo 160 px) en la cabecera sobre fondo oscuro; versión vertical principal (`logo-vertical.webp`, 160 px) en el cierre; símbolo del casco (`casco-white.webp`, 32 px+) como indicador del riel de misión y favicon. Todos con su zona de protección libre (`x = altura de ACADEMY`). |
| **Nombre de marca** | Primera mención y título oficial como **Campuslands AI Academy**; menciones siguientes como **AI Academy**; la tecnología en textos en español siempre escrita como **IA** (corrigiendo los «IA Academy» de la versión anterior). |
| **Recursos gráficos** | Halos en esquinas opuestas (`Electric Violet` arriba a la derecha y `Evox Purple` abajo a la izquierda, nunca detrás del texto), etiquetas en píldora (`Soft Violet` con texto `Black`), pasos numerados en `Evox Purple`, tarjetas con fondo `Soft Violet` al 10 % y radio de 28 px, bloque de cierre en `Evox Purple` con radio de 32 px y presencia de **Max** con sus expresiones aprobadas (*Presentando*, *Aprobando*, *Explicando*, *Trabajando*, *Pausa de café* y visores LED). |
| **Voz y copy** | Español claro, cercano y en voz activa. Frases cortas, nombres reales de herramientas (`ChatGPT`, `Claude`, `Gemini`, `n8n`, `Make`), sin clichés («revolucionario», «el futuro ya llegó») ni anglicismos innecesarios («flujo» en lugar de «workflow»). |

---

## Piezas interactivas incluidas

1. **Hero reactivo al visitante (`#inicio`)**
   - Selector de perfil (*«Antes de despegar, ¿quién eres?: Empresa · Líder de equipo · Independiente»*) que adapta en vivo la propuesta de valor, los puntos clave, la pose de Max, el HUD de misión, la misión recomendada y el caso de uso activo.
   - Campo estelar animado en `<canvas>` y parallax suave con el movimiento del puntero (desactivado automáticamente si el usuario tiene `prefers-reduced-motion: reduce`).
2. **Recorrido narrativo con el scroll**
   - Riel de misión vertical en escritorio (`T-0 · Cabina` → `08 · Despegue`) con el casco avanzando en tiempo real y barra superior de progreso con etapa activa en móvil.
   - Revelado progresivo de secciones y altímetros de misión que se cargan al entrar en pantalla.
3. **Recomendador interactivo de planes (`#planes`)**
   - Calculadora de trayectoria en 3 preguntas (*quién se forma*, *tiempo disponible* y *objetivo principal*) que sugiere la misión ideal (**Ignition 4 h**, **Booster 8 h**, **Liftoff 12 h**, **Odyssey personalizado** o **Nebula pregrabado**) y la destaca en la grilla inferior.
4. **Exploración libre**
   - **Constelación interactiva de las 14 herramientas (`#herramientas`)**: mapa estelar con filtros por categoría (*Asistentes, Automatización, Investigación, Productividad, Creación, Código*), conexiones luminosas entre herramientas afines, panel de detalle en vivo y contador de herramientas exploradas.
   - **Comparador deslizable Antes / Después (`#casos-uso`)**: control táctil y por teclado para los 4 perfiles (*Empresario, Director(a) de innovación, Profesional independiente y Líder de RR. HH.*).
   - **Calculadora del costo de esperar (`#por-que-ahora`)**: cálculo transparente de horas anuales dedicadas a tareas repetitivas con los datos del visitante.

---

## Enlaces y conversión conservados

- **Inscripción**: `https://campuslands.aiacademy.com.co/inscripcion`
- **Diagnóstico empresarial**: `https://campuslands.aiacademy.com.co/diagnostico`
- **Validación de certificados**: `https://campuslands.aiacademy.com.co/certificado`
- **WhatsApp especialista**: `https://wa.me/573052105674`
- **Dock flotante de conversión**: visible al recorrer la página en escritorio y fijo en la parte inferior en móvil para tener siempre a mano **WhatsApp** e **Inscríbete** sin interrumpir la lectura.

---

## Estructura del repositorio

```text
├── index.html          # Estructura semántica y contenido de las 9 secciones
├── css/
│   └── styles.css      # Sistema de diseño fiel al Manual de Marca v1.0 (Mobile-First, 375px+)
├── js/
│   └── main.js         # Lógica de las piezas interactivas y accesibilidad
└── assets/
    ├── img/            # Logos oficiales, casco y poses/visores de Max en WebP optimizado
    └── tools/          # Iconos SVG de las 14 herramientas de IA
```
