'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, User as UserIcon, BookOpen, CheckSquare, Users, Sparkles, X } from 'lucide-react';
import { useEduSpare } from '@/context/EduSpareContext';

export const UniversalSearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const {
    setActiveTab,
    setSelectedUsername,
    setSelectedTaskId,
    setSelectedCommunityId,
  } = useEduSpare();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectResult = (item: any) => {
    setIsOpen(false);
    setQuery('');

    if (item.type === 'user') {
      setSelectedUsername(item.raw.username);
      setActiveTab('profile');
    } else if (item.type === 'blog') {
      setActiveTab('blog');
    } else if (item.type === 'task') {
      setSelectedTaskId(item.id);
      setActiveTab('tasks');
    } else if (item.type === 'community') {
      setSelectedCommunityId(item.id);
      setActiveTab('communities');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <UserIcon className="w-4 h-4 text-blue-600" />;
      case 'blog':
        return <BookOpen className="w-4 h-4 text-purple-600" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-emerald-600" />;
      case 'community':
        return <Users className="w-4 h-4 text-amber-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder="Search people, tags, blogs, or topics..."
          className="w-full pl-10 pr-9 py-2 text-sm bg-surface-container-low text-on-surface placeholder:text-outline border border-outline-variant/60 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-lowest transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recommendations Auto-complete Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-lowest rounded-2xl shadow-xl border border-outline-variant/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="p-2 border-b border-outline-variant/40 bg-surface-container-low/50 flex items-center justify-between text-xs font-semibold text-outline px-3">
            <span>RECOMMENDATIONS</span>
            {loading && <span className="animate-pulse">Searching...</span>}
          </div>

          {results.length === 0 ? (
            <div className="p-4 text-center text-sm text-outline">
              No matching profiles, blogs, or topics found.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/30 p-1">
              {results.map((item, idx) => (
                <button
                  key={`${item.type}-${item.id}-${idx}`}
                  onClick={() => handleSelectResult(item)}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-surface-container-low transition-colors flex items-center gap-3 group"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                    {getIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">
                      {item.title}
                    </div>
                    <div className="text-xs text-outline truncate">{item.subtitle}</div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-surface-variant text-on-surface-variant">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
