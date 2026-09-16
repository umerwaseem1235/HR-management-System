export interface CompModalState {
  id?: string;
  name: string;
  amount: string;
  kind: 'allowance' | 'deduction';
}

export interface MonthFilterOption {
  value: string;
  label: string;
}
