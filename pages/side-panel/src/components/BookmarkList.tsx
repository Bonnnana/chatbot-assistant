/* eslint-disable react/prop-types */
import React from 'react';

interface Bookmark {
  id: number;
  title: string;
  content: string;
}

interface BookmarkListProps {
  bookmarks: Bookmark[];
  onBookmarkSelect: (content: string) => void;
  isDarkMode?: boolean;
}

const BookmarkList: React.FC<BookmarkListProps> = ({ bookmarks, onBookmarkSelect, isDarkMode = false }) => {
  return (
    <div className="p-2">
      <h3 className={`mb-3 text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-white'}`}>Suggestions</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {bookmarks.map(bookmark => (
          <div
            key={bookmark.id}
            className={`group relative rounded-lg p-3 ${
              isDarkMode ? 'bg-[#34699A]/70 hover:bg-[#34699A]/80' : 'bg-white hover:bg-white'
            } border ${isDarkMode ? 'border-slate-700' : 'border-[#FDF5AA]'}`}>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onBookmarkSelect(bookmark.content)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onBookmarkSelect(bookmark.content);
                  }
                }}
                className="w-full text-left">
                <div className={`truncate text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {bookmark.title}
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookmarkList;
