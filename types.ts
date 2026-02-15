export enum DataFormat {
  JSON = 'JSON',
  CSV = 'CSV',
  XML = 'XML',
  TXT = 'TXT',
}

export interface GenerationOptions {
  dateFormat: string;
  decimalPlaces: string;
}