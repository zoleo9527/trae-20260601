import type { TestTemplate } from '@/types';

export const mockTestTemplates: TestTemplate[] = [
  {
    formula: 'IPA-001-v2',
    items: [
      { itemName: '酒精度', standard: '6.3-6.7%' },
      { itemName: '原麦汁浓度', standard: '15.0-16.0°P' },
      { itemName: 'PH值', standard: '4.0-4.4' },
      { itemName: 'IBU', standard: '55-65' },
      { itemName: '浊度', standard: '< 2.0 EBC' },
      { itemName: '菌落总数', standard: '< 100 CFU/mL' },
    ],
  },
  {
    formula: 'STOUT-003',
    items: [
      { itemName: '酒精度', standard: '5.5-6.0%' },
      { itemName: '原麦汁浓度', standard: '14.0-15.0°P' },
      { itemName: 'PH值', standard: '4.0-4.5' },
      { itemName: '色度', standard: '60-80 EBC' },
      { itemName: '浊度', standard: '< 3.0 EBC' },
      { itemName: '菌落总数', standard: '< 100 CFU/mL' },
    ],
  },
  {
    formula: 'WEISS-002',
    items: [
      { itemName: '酒精度', standard: '5.0-5.4%' },
      { itemName: '原麦汁浓度', standard: '12.0-13.0°P' },
      { itemName: 'PH值', standard: '4.0-4.4' },
      { itemName: '浊度', standard: '< 1.0 EBC' },
      { itemName: '菌落总数', standard: '< 100 CFU/mL' },
    ],
  },
  {
    formula: 'SOUR-001-mango',
    items: [
      { itemName: '酒精度', standard: '4.3-4.7%' },
      { itemName: '原麦汁浓度', standard: '11.5-12.0°P' },
      { itemName: 'PH值', standard: '3.5-3.8' },
      { itemName: '浊度', standard: '< 1.5 EBC' },
      { itemName: '总酸', standard: '6.0-8.0 mL/100mL' },
      { itemName: '菌落总数', standard: '< 100 CFU/mL' },
    ],
  },
  {
    formula: 'WIPA-004',
    items: [
      { itemName: '酒精度', standard: '6.8-7.2%' },
      { itemName: '原麦汁浓度', standard: '15.5-16.5°P' },
      { itemName: 'PH值', standard: '4.0-4.4' },
      { itemName: 'IBU', standard: '60-70' },
      { itemName: '菌落总数', standard: '< 100 CFU/mL' },
    ],
  },
  {
    formula: 'BROWN-001',
    items: [
      { itemName: '酒精度', standard: '5.3-5.7%' },
      { itemName: '原麦汁浓度', standard: '13.0-14.0°P' },
      { itemName: '双乙酰', standard: '< 0.10 ppm' },
      { itemName: 'PH值', standard: '4.2-4.5' },
      { itemName: '色度', standard: '15-20 EBC' },
    ],
  },
  {
    formula: 'PILSNER-002',
    items: [
      { itemName: '酒精度', standard: '4.6-5.0%' },
      { itemName: '原麦汁浓度', standard: '10.5-11.5°P' },
      { itemName: 'PH值', standard: '4.2-4.4' },
      { itemName: '浊度', standard: '< 0.8 EBC' },
      { itemName: '苦味质', standard: '15-20 BU' },
    ],
  },
  {
    formula: 'LAMBIC-cherry',
    items: [
      { itemName: '酒精度', standard: '4.8-5.2%' },
      { itemName: '原麦汁浓度', standard: '12.0-13.0°P' },
      { itemName: 'PH值', standard: '3.2-3.6' },
      { itemName: '色度', standard: '25-35 EBC' },
      { itemName: '总酸', standard: '7.0-9.0 mL/100mL' },
      { itemName: '菌落总数', standard: '< 100 CFU/mL' },
    ],
  },
];
