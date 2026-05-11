declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    version: string;
    text: string;
    [key: string]: any;
  }

  function pdfParse(data: Buffer | ArrayBuffer, options?: any): Promise<PDFData>;
  export = pdfParse;
}
