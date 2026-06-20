const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient();

const watches = [
  {
    name: "Dos&Go Chrono Elite",
    description: "Reloj cronógrafo de alta gama con caja de acero inoxidable 316L. Movimiento de cuarzo suizo de precisión con funciones cronógrafo, fecha y luminiscencia. Resistente al agua hasta 100m.",
    price: 289.99,
    images: JSON.stringify(["/watches/chrono-elite.jpg"]),
    category: "Cronógrafos",
    brand: "Dos&Go",
    stock: 15,
    featured: true,
  },
  {
    name: "Dos&Go Sport Pro",
    description: "Diseñado para los amantes del deporte. Caja de titanio ultraligero, cristal de zafiro anti-rayos, correa de caucho de alta resistencia. Batería de larga duración y sumergible hasta 200m.",
    price: 199.99,
    images: JSON.stringify(["/watches/sport-pro.jpg"]),
    category: "Deportivos",
    brand: "Dos&Go",
    stock: 20,
    featured: true,
  },
  {
    name: "Dos&Go Classic Gold",
    description: "Elegancia atemporal en chapado en oro 18K. Esfera de nácar con índices de diamante, correa de piel italiana genuina. El accesorio perfecto para ocasiones especiales.",
    price: 459.99,
    images: JSON.stringify(["/watches/classic-gold.jpg"]),
    category: "Clásicos",
    brand: "Dos&Go",
    stock: 8,
    featured: true,
  },
  {
    name: "Dos&Go Urban Slim",
    description: "Minimalismo urbano en su máxima expresión. Perfil ultra-delgado de 6mm, correa de malla milanesa en acero, esfera simple con punteros noctiluminosos. El reloj del día a día.",
    price: 149.99,
    images: JSON.stringify(["/watches/urban-slim.jpg"]),
    category: "Minimalistas",
    brand: "Dos&Go",
    stock: 25,
    featured: false,
  },
  {
    name: "Dos&Go Dive Master",
    description: "Reloj de buceo profesional certificado. Resistente al agua hasta 300m con válvula helio, bisel giratorio unidireccional de aluminio anodizado, cristal de zafiro anti-arañazos.",
    price: 329.99,
    images: JSON.stringify(["/watches/dive-master.jpg"]),
    category: "Deportivos",
    brand: "Dos&Go",
    stock: 12,
    featured: false,
  },
  {
    name: "Dos&Go Lady Rose",
    description: "Feminidad y elegancia en un solo reloj. Caja de acero rosado con incrustaciones de cristales, correa de piel italiana en color nude. Movimiento de cuarzo suizo de alta precisión.",
    price: 219.99,
    images: JSON.stringify(["/watches/lady-rose.jpg"]),
    category: "Para Ella",
    brand: "Dos&Go",
    stock: 18,
    featured: true,
  },
  {
    name: "Dos&Go Heritage Bronze",
    description: "Inspirado en los grandes relojes de aviación de los años 40. Caja de bronce con pátina natural, esfera vintage con numerales árabes y segundero a las 9. Movimiento automático japonés.",
    price: 399.99,
    images: JSON.stringify(["/watches/heritage-bronze.jpg"]),
    category: "Clásicos",
    brand: "Dos&Go",
    stock: 6,
    featured: false,
  },
  {
    name: "Dos&Go Smartech Pro",
    description: "La perfecta fusión entre relojería tradicional y tecnología moderna. Conectividad Bluetooth, notificaciones, monitoreo de salud, GPS integrado y hasta 7 días de batería. Compatible con iOS y Android.",
    price: 349.99,
    images: JSON.stringify(["/watches/smartech-pro.jpg"]),
    category: "Smart",
    brand: "Dos&Go",
    stock: 30,
    featured: false,
  },
];

async function main() {
  console.log("Seeding database...");
  for (const watch of watches) {
    await prisma.product.create({ data: watch });
  }
  console.log(`Created ${watches.length} products`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
