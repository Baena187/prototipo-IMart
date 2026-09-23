import { ProductStatus, type Product } from '@/types';

export const BRANDS = ['Zaeli', 'Renata', 'Galo', 'Barão', 'Qualimax', 'Vidan'] as const;

export const BRAND_COLORS: Record<string, string> = {
  Zaeli: '#d97706',
  Renata: '#b91c1c',
  Galo: '#ca8a04',
  Barão: '#15803d',
  Qualimax: '#ea580c',
  Vidan: '#1d4ed8',
};

export const CATEGORIES = [
  'Amidos e Farináceos',
  'Biscoitos',
  'Molhos e Atomatados',
  'Massas',
  'Erva-Mate e Tereré',
  'Refrescos',
  'Food Service',
  'Pet',
] as const;

type ProductSeed = [
  brand: string,
  line: string | undefined,
  shortName: string,
  description: string,
  category: string,
  unit: string,
  price: number,
  promoPrice: number | undefined,
  status?: ProductStatus,
];

const seeds: ProductSeed[] = [
  // Zaeli
  ['Zaeli', undefined, 'Zaeli Maizena', 'Amido de Milho Zaeli 500g', 'Amidos e Farináceos', '500g', 4.99, 4.49],
  ['Zaeli', undefined, 'Zaeli Maizena 200g', 'Amido de Milho Zaeli 200g', 'Amidos e Farináceos', '200g', 2.79, undefined],
  ['Zaeli', undefined, 'Zaeli Flocão', 'Farinha de Milho Flocada Zaeli 500g', 'Amidos e Farináceos', '500g', 3.29, 2.99],
  ['Zaeli', undefined, 'Zaeli Fubá Mimoso', 'Fubá Mimoso Zaeli 1kg', 'Amidos e Farináceos', '1kg', 4.59, undefined],
  ['Zaeli', undefined, 'Zaeli Canjica Branca', 'Canjica de Milho Branca Zaeli 500g', 'Amidos e Farináceos', '500g', 5.19, undefined],
  ['Zaeli', undefined, 'Zaeli Milho Pipoca', 'Milho para Pipoca Zaeli 500g', 'Amidos e Farináceos', '500g', 5.49, 4.99],
  ['Zaeli', undefined, 'Zaeli Farofa Pronta', 'Farofa de Mandioca Temperada Zaeli 250g', 'Amidos e Farináceos', '250g', 4.39, undefined],
  ['Zaeli', undefined, 'Zaeli Biscoito Chocolate', 'Biscoito Recheado Chocolate Zaeli 120g', 'Biscoitos', '120g', 2.49, 1.99],
  ['Zaeli', undefined, 'Zaeli Biscoito Morango', 'Biscoito Recheado Morango Zaeli 120g', 'Biscoitos', '120g', 2.49, undefined],
  ['Zaeli', undefined, 'Zaeli Cream Cracker', 'Biscoito Cream Cracker Zaeli 350g', 'Biscoitos', '350g', 4.89, undefined],
  ['Zaeli', undefined, 'Zaeli Biscoito Maria', 'Biscoito Maria Zaeli 350g', 'Biscoitos', '350g', 4.59, undefined, ProductStatus.Lancamento],
  ['Zaeli', undefined, 'Zaeli Molho de Tomate', 'Molho de Tomate Tradicional Zaeli Sachê 340g', 'Molhos e Atomatados', '340g', 2.99, 2.49],
  ['Zaeli', undefined, 'Zaeli Molho Pizza', 'Molho de Tomate Pizza Zaeli Sachê 340g', 'Molhos e Atomatados', '340g', 3.19, undefined],
  ['Zaeli', undefined, 'Zaeli Molho Manjericão', 'Molho de Tomate com Manjericão Zaeli 340g', 'Molhos e Atomatados', '340g', 3.29, undefined],
  ['Zaeli', undefined, 'Zaeli Extrato de Tomate', 'Extrato de Tomate Zaeli 190g', 'Molhos e Atomatados', '190g', 3.49, undefined],
  // Selmi / Renata
  ['Renata', 'Selmi', 'Renata Espaguete', 'Macarrão Espaguete nº 8 Renata 500g', 'Massas', '500g', 5.49, 4.99],
  ['Renata', 'Selmi', 'Renata Parafuso', 'Macarrão Parafuso Renata 500g', 'Massas', '500g', 5.49, undefined],
  ['Renata', 'Selmi', 'Renata Penne', 'Macarrão Penne Renata 500g', 'Massas', '500g', 5.49, 4.99],
  ['Renata', 'Selmi', 'Renata Talharim', 'Macarrão Talharim Renata 500g', 'Massas', '500g', 6.29, undefined],
  ['Renata', 'Selmi', 'Renata Lasanha', 'Massa para Lasanha Renata 500g', 'Massas', '500g', 7.49, 6.99],
  ['Renata', 'Selmi', 'Renata Espaguete Integral', 'Macarrão Espaguete Integral Renata 500g', 'Massas', '500g', 7.89, undefined, ProductStatus.Lancamento],
  ['Renata', 'Selmi', 'Renata Ave Maria', 'Macarrão Ave Maria Renata 500g', 'Massas', '500g', 5.29, undefined],
  // Selmi / Galo
  ['Galo', 'Selmi', 'Galo Espaguete', 'Macarrão com Ovos Espaguete Galo 500g', 'Massas', '500g', 4.29, 3.89],
  ['Galo', 'Selmi', 'Galo Parafuso', 'Macarrão com Ovos Parafuso Galo 500g', 'Massas', '500g', 4.29, undefined],
  ['Galo', 'Selmi', 'Galo Penne', 'Macarrão com Ovos Penne Galo 500g', 'Massas', '500g', 4.29, undefined],
  ['Galo', 'Selmi', 'Galo Ninho', 'Macarrão com Ovos Ninho Galo 500g', 'Massas', '500g', 4.59, undefined],
  ['Galo', 'Selmi', 'Galo Instantâneo Galinha', 'Macarrão Instantâneo Galinha Galo 85g', 'Massas', '85g', 1.69, 1.49],
  // Barão
  ['Barão', undefined, 'Barão Erva-Mate Tradicional', 'Erva-Mate para Chimarrão Tradicional Barão 1kg', 'Erva-Mate e Tereré', '1kg', 18.9, 16.9],
  ['Barão', undefined, 'Barão Chimarrão Moída Grossa', 'Erva-Mate Chimarrão Moída Grossa Barão 1kg', 'Erva-Mate e Tereré', '1kg', 19.9, undefined],
  ['Barão', undefined, 'Barão Chimarrão Nativa', 'Erva-Mate Chimarrão Nativa Barão 500g', 'Erva-Mate e Tereré', '500g', 11.49, undefined],
  ['Barão', undefined, 'Barão Tereré Tradicional', 'Erva-Mate para Tereré Tradicional Barão 500g', 'Erva-Mate e Tereré', '500g', 12.9, undefined],
  ['Barão', undefined, 'Barão Tereré Menta', 'Erva-Mate para Tereré Menta Barão 500g', 'Erva-Mate e Tereré', '500g', 13.49, 11.99],
  ['Barão', undefined, 'Barão Tereré Limão', 'Erva-Mate para Tereré Limão Barão 500g', 'Erva-Mate e Tereré', '500g', 13.49, undefined],
  ['Barão', undefined, 'Barão Tereré Hortelã', 'Erva-Mate para Tereré Hortelã Barão 500g', 'Erva-Mate e Tereré', '500g', 13.49, undefined],
  ['Barão', undefined, 'Barão Tereré Abacaxi', 'Erva-Mate para Tereré Abacaxi com Hortelã Barão 500g', 'Erva-Mate e Tereré', '500g', 13.99, undefined, ProductStatus.Lancamento],
  ['Barão', undefined, 'Barão Erva Saborizada Maracujá', 'Erva-Mate Saborizada Maracujá Barão 250g', 'Erva-Mate e Tereré', '250g', 8.9, undefined],
  ['Barão', undefined, 'Barão Erva Saborizada Frutas Vermelhas', 'Erva-Mate Saborizada Frutas Vermelhas Barão 250g', 'Erva-Mate e Tereré', '250g', 8.9, undefined],
  // Qualimax
  ['Qualimax', undefined, 'Qualimax Refresco Laranja', 'Refresco em Pó Laranja Qualimax 25g', 'Refrescos', '25g', 0.99, 0.79],
  ['Qualimax', undefined, 'Qualimax Refresco Uva', 'Refresco em Pó Uva Qualimax 25g', 'Refrescos', '25g', 0.99, undefined],
  ['Qualimax', undefined, 'Qualimax Refresco Limão', 'Refresco em Pó Limão Qualimax 25g', 'Refrescos', '25g', 0.99, undefined],
  ['Qualimax', undefined, 'Qualimax Refresco Maracujá', 'Refresco em Pó Maracujá Qualimax 25g', 'Refrescos', '25g', 0.99, 0.79],
  ['Qualimax', undefined, 'Qualimax Refresco Abacaxi', 'Refresco em Pó Abacaxi Qualimax 25g', 'Refrescos', '25g', 0.99, undefined],
  ['Qualimax', undefined, 'Qualimax Refresco Morango', 'Refresco em Pó Morango Qualimax 25g', 'Refrescos', '25g', 0.99, undefined],
  ['Qualimax', undefined, 'Qualimax Refresco Tangerina', 'Refresco em Pó Tangerina Qualimax 25g', 'Refrescos', '25g', 0.99, undefined, ProductStatus.Lancamento],
  ['Qualimax', 'Food Service', 'Qualimax FS Laranja 1kg', 'Refresco em Pó Laranja Qualimax Food Service 1kg', 'Food Service', '1kg', 24.9, 22.9],
  ['Qualimax', 'Food Service', 'Qualimax FS Uva 1kg', 'Refresco em Pó Uva Qualimax Food Service 1kg', 'Food Service', '1kg', 24.9, undefined],
  ['Qualimax', 'Food Service', 'Qualimax FS Limão 1kg', 'Refresco em Pó Limão Qualimax Food Service 1kg', 'Food Service', '1kg', 24.9, undefined],
  ['Qualimax', 'Food Service', 'Qualimax FS Cappuccino 1kg', 'Cappuccino Tradicional Qualimax Food Service 1kg', 'Food Service', '1kg', 39.9, undefined],
  // Vidan
  ['Vidan', undefined, 'Vidan Cães Adultos 15kg', 'Ração Vidan Cães Adultos Carne e Cereais 15kg', 'Pet', '15kg', 119.9, 109.9],
  ['Vidan', undefined, 'Vidan Cães Adultos 1kg', 'Ração Vidan Cães Adultos Carne e Cereais 1kg', 'Pet', '1kg', 11.9, undefined],
  ['Vidan', undefined, 'Vidan Cães Filhotes 3kg', 'Ração Vidan Cães Filhotes Frango e Leite 3kg', 'Pet', '3kg', 34.9, undefined],
  ['Vidan', undefined, 'Vidan Cães Raças Pequenas 3kg', 'Ração Vidan Cães Adultos Raças Pequenas 3kg', 'Pet', '3kg', 36.9, 32.9],
  ['Vidan', undefined, 'Vidan Gatos Adultos 1kg', 'Ração Vidan Gatos Adultos Peixe 1kg', 'Pet', '1kg', 14.9, undefined],
  ['Vidan', undefined, 'Vidan Gatos Castrados 1kg', 'Ração Vidan Gatos Castrados Frango 1kg', 'Pet', '1kg', 16.9, 14.9],
  ['Vidan', undefined, 'Vidan Gatos Filhotes 1kg', 'Ração Vidan Gatos Filhotes 1kg', 'Pet', '1kg', 15.9, undefined, ProductStatus.Inativo],
];

export const productsSeed = (): Product[] =>
  seeds.map((s, i) => {
    const n = i + 1;
    const brandCode = s[0].normalize('NFD').replace(/[̀-ͯ]/g, '').slice(0, 3).toUpperCase();
    return {
      id: `p${String(n).padStart(3, '0')}`,
      code: String(10000 + n * 7),
      sku: `${brandCode}-${String(1000 + n * 13)}`,
      ean: `789${String(6153000000 + n * 104729).slice(0, 10)}`,
      description: s[3],
      shortName: s[2],
      brand: s[0],
      line: s[1],
      category: s[4],
      unit: s[5],
      price: s[6],
      previousPrice: Math.round(s[6] * 1.06 * 100) / 100,
      promoPrice: s[7],
      status: s[8] ?? ProductStatus.Ativo,
      color: BRAND_COLORS[s[0]],
    };
  });
