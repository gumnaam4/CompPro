import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, loading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="glass animate-fade-in"
      style={{
        maxWidth: '700px',
        margin: '2rem auto',
        borderRadius: 0,
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Search size={20} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search regulations (e.g. Finance, Healthcare, Data)..."
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          fontSize: '1.1rem',
          width: '100%',
          padding: '0.8rem 0',
        }}
      />
      {query && !loading && (
        <button
          type="button"
          onClick={() => setQuery('')}
          style={{ background: 'none', color: 'var(--text-secondary)' }}
        >
          <X size={18} />
        </button>
      )}
      <button
        type="submit"
        disabled={loading}
        style={{
          background: '#27272a',
          color: '#e4e4e7',
          padding: '0.6rem 1.5rem',
          borderRadius: 0,
          border: '1px solid rgba(255,255,255,0.08)',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Searching...' : 'Search'}
      </button>
    </form>
  );
};

export default SearchBar;
