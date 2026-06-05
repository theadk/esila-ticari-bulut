import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (limit: number) => void;
    totalItems: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange, totalItems }: PaginationProps) {
    return (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 border-t border-gray-200">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
                <span className="text-sm text-gray-500">Sayfa Başına Kayıt:</span>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        onItemsPerPageChange(Number(e.target.value));
                        onPageChange(1); // Sayfa boyutu değiştiğinde 1. sayfaya dön
                    }}
                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={-1}>Tamamı</option>
                </select>
                <span className="text-sm text-gray-500 ml-2">Toplam {totalItems} kayıt</span>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || itemsPerPage === -1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={20} className="text-gray-600" />
                </button>
                
                {itemsPerPage !== -1 && (
                    <span className="text-sm text-gray-600 px-3">
                        Sayfa {currentPage} / {totalPages > 0 ? totalPages : 1}
                    </span>
                )}
                {itemsPerPage === -1 && (
                     <span className="text-sm text-gray-600 px-3">
                     Tümü Gösteriliyor
                    </span>
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || itemsPerPage === -1 || totalPages === 0}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={20} className="text-gray-600" />
                </button>
            </div>
        </div>
    );
}
