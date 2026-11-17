import React from 'react';
import { Product, AppPublicSettings, Purchase } from '../../types';
import { MobileHomeView } from './MobileHomeView';

interface HomeViewProps {
  products: Product[];
  freeNotes?: Product[];
  purchases?: Purchase[];
  settings: AppPublicSettings | null;
  purchasedProductIds: Set<string>;
  onNavigate: (view: string, filterParam?: any) => void;
  onViewDetails: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  onDownloadNotes: (product: Product) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onExecuteSearch: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  products,
  freeNotes = [],
  purchases = [],
  settings,
  purchasedProductIds,
  onNavigate,
  onViewDetails,
  onBuyNow,
  onDownloadNotes,
  searchQuery,
  onSearchChange,
  onExecuteSearch
}) => {
  const publishedProducts = products.filter((p) => p.published);
  const internalFreeNotes = publishedProducts.filter(
    (p) => p.isFree === true || (p as any).freeNote === true || (p.category as any) === 'Free'
  );
  const effectiveFreeNotes = freeNotes && freeNotes.length > 0 ? freeNotes : internalFreeNotes;

  return (
    <div className="w-full">
      <MobileHomeView
        products={products}
        freeNotes={effectiveFreeNotes}
        settings={settings}
        purchasedProductIds={purchasedProductIds}
        purchases={purchases}
        onNavigate={onNavigate}
        onViewDetails={onViewDetails}
        onBuyNow={onBuyNow}
        onDownloadNotes={onDownloadNotes}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onExecuteSearch={onExecuteSearch}
      />
    </div>
  );
};
