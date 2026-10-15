export type BlockType =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'paragraph'
  | 'list'
  | 'table'
  | 'quote'
  | 'callout'
  | 'image'
  | 'form-field'
  | 'divider'
  | 'page-break';

export interface FormFieldData {
  type: 'text' | 'textarea' | 'checkbox' | 'date' | 'signature';
  label: string;
  placeholder?: string;
  defaultValue?: string;
  checked?: boolean;
  fieldName: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
}

export interface DocumentBlock {
  id: string;
  type: BlockType;
  content?: string;
  originalContent?: string;
  slovakContent?: string;
  listItems?: string[];
  originalListItems?: string[];
  slovakListItems?: string[];
  listType?: 'unordered' | 'ordered';
  tableData?: TableData;
  originalTableData?: TableData;
  slovakTableData?: TableData;
  imageSrc?: string;
  imageAlt?: string;
  imageCaption?: string;
  formField?: FormFieldData;
  customStyle?: {
    align?: 'left' | 'center' | 'right' | 'justify';
    bold?: boolean;
    italic?: boolean;
    highlight?: boolean;
  };
}

export type DocumentLanguageView = 'slovak' | 'original' | 'bilingual';

export interface DocumentMetadata {
  title: string;
  originalTitle: string;
  slovakTitle: string;
  sourceUrl: string;
  author: string;
  date: string;
  description?: string;
  slovakSummary?: string;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  fontFamily: 'sans' | 'serif' | 'mono';
  fontSize: 'sm' | 'base' | 'lg';
  headerText: string;
  footerText: string;
  showPageNumbers: boolean;
  showSourceHeader: boolean;
}
