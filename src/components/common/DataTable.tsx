import React, { ReactNode } from 'react';

export const DataTable = ({ children, minWidth = '1000px', className = '' }: { children: ReactNode, minWidth?: string, className?: string }) => (
  <table className={`w-full text-left border-collapse border-spacing-0 ${className}`} style={{ minWidth }}>
    {children}
  </table>
);

DataTable.Head = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <thead className={`${className}`}>
    {children}
  </thead>
);

DataTable.HeaderCell = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <th className={`px-4 py-3 text-[10px] font-black text-on-surface-variant/60 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

DataTable.Body = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <tbody className={`divide-y divide-outline-variant/5 ${className}`}>
    {children}
  </tbody>
);

DataTable.Row = ({ children, className = '', onClick }: { children: ReactNode, className?: string, onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void }) => (
  <tr className={`hover:bg-neutral-50/50 transition-colors ${className}`} onClick={onClick}>
    {children}
  </tr>
);

DataTable.Cell = ({ children, className = '', colSpan, onClick }: { children: ReactNode, className?: string, colSpan?: number, onClick?: (e: React.MouseEvent<HTMLTableCellElement>) => void }) => (
  <td className={`px-4 py-3 text-xs text-on-surface-variant/80 ${className}`} colSpan={colSpan} onClick={onClick}>
    {children}
  </td>
);
