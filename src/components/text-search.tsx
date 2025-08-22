import { useState, useEffect } from 'react';
import { Input } from '@src/components/ui/input';
import { Button } from '@src/components/ui/button';
import { Badge } from '@src/components/ui/badge';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@src/components/ui/card';

interface TextSearchProps {
  text: string;
  onHighlight?: (searchTerm: string, matches: number) => void;
}

interface SearchMatch {
  index: number;
  length: number;
}

export default function TextSearch({ text, onHighlight }: TextSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Find all matches in the text
  const findMatches = (term: string, content: string): SearchMatch[] => {
    if (!term.trim()) return [];
    
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const foundMatches: SearchMatch[] = [];
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      foundMatches.push({
        index: match.index,
        length: term.length
      });
    }
    
    return foundMatches;
  };

  // Update matches when search term changes
  useEffect(() => {
    const newMatches = findMatches(searchTerm, text);
    setMatches(newMatches);
    setCurrentMatchIndex(0);
    
    if (onHighlight) {
      onHighlight(searchTerm, newMatches.length);
    }
  }, [searchTerm, text, onHighlight]);

  // Navigate to next match
  const nextMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
      scrollToMatch((currentMatchIndex + 1) % matches.length);
    }
  };

  // Navigate to previous match
  const prevMatch = () => {
    if (matches.length > 0) {
      setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
      scrollToMatch((currentMatchIndex - 1 + matches.length) % matches.length);
    }
  };

  // Scroll to specific match
  const scrollToMatch = (matchIndex: number) => {
    const matchElement = document.querySelector(`[data-search-match="${matchIndex}"]`);
    if (matchElement) {
      matchElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setMatches([]);
    setCurrentMatchIndex(0);
    if (onHighlight) {
      onHighlight('', 0);
    }
  };

  // Highlight text with search matches
  const highlightText = (content: string): JSX.Element => {
    if (!searchTerm || matches.length === 0) {
      return <span>{content}</span>;
    }

    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(
          <span key={`before-${index}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      // Add highlighted match
      const isCurrentMatch = index === currentMatchIndex;
      parts.push(
        <mark
          key={`match-${index}`}
          data-search-match={index}
          className={`px-1 py-0.5 rounded ${
            isCurrentMatch
              ? 'bg-yellow-300 ring-2 ring-yellow-500'
              : 'bg-yellow-200'
          }`}
        >
          {content.substring(match.index, match.index + match.length)}
        </mark>
      );

      lastIndex = match.index + match.length;
    });

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(
        <span key="after">{content.substring(lastIndex)}</span>
      );
    }

    return <span>{parts}</span>;
  };

  return (
    <div className="space-y-3">
      {/* Search Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsSearchVisible(!isSearchVisible)}
        className="w-full"
      >
        <Search className="h-4 w-4 mr-2" />
        Search in Text
      </Button>

      {/* Search Interface */}
      {isSearchVisible && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  placeholder="Search for terms in the clinical note..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-8"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Search Results */}
            {matches.length > 0 && (
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {matches.length} match{matches.length !== 1 ? 'es' : ''} found
                </Badge>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-600">
                    {currentMatchIndex + 1} of {matches.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={prevMatch}
                    disabled={matches.length === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextMatch}
                    disabled={matches.length === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {searchTerm && matches.length === 0 && (
              <p className="text-sm text-gray-500">No matches found</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Highlighted Text Content */}
      <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {highlightText(text)}
        </pre>
      </div>
    </div>
  );
}